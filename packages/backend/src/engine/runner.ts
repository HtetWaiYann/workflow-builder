import type { WorkflowNode, WorkflowEdge } from '@workflow-builder/shared'
import {
  BRANCH_HANDLE_KEY,
  ERROR_HANDLE_ID,
  NodeErrorConfigSchema,
} from '@workflow-builder/shared'
import type { Prisma } from '../generated/prisma/client'
import { prisma } from '../db/client'
import { logger } from '../lib/logger'
import { buildExecutionOrder, hasCycle } from './dag'
import { getExecutor } from './registry'
import { createExecutionContext } from './context'
import { resolveVariables } from '../services/variableResolver'
import { decrypt } from '../services/encryptionService'

const toJson = (v: Record<string, unknown>): Prisma.InputJsonValue =>
  v as unknown as Prisma.InputJsonValue

const BRANCHING_TYPES = new Set(['if-condition', 'switch'])

/**
 * Loads and decrypts all workspace variables for the given workflow's workspace.
 * Returns a plain map of key → decrypted value for use in variable resolution.
 *
 * @param workflowId - Used to look up the parent workspace.
 * @returns Record of variable key to plaintext value.
 */
async function loadWorkspaceVars(
  workflowId: string
): Promise<Record<string, string>> {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    select: { workspaceId: true },
  })
  if (!workflow) return {}

  const variables = await prisma.workspaceVariable.findMany({
    where: { workspaceId: workflow.workspaceId },
  })

  const vars: Record<string, string> = {}
  for (const v of variables) {
    try {
      vars[v.key] = decrypt(v.encryptedValue, v.iv, v.authTag)
    } catch (err) {
      logger.error(
        { variableKey: v.key, err },
        'Failed to decrypt workspace variable'
      )
    }
  }
  return vars
}

/**
 * Executes a workflow by running each node in topological order, respecting
 * branching (if-condition, switch) and merge nodes. Nodes on inactive branches
 * are marked SKIPPED. Workspace variable placeholders are resolved before each
 * executor call.
 *
 * Never throws — all errors are caught and written to the database.
 *
 * @param executionId - The Execution record id to update throughout the run.
 * @param nodes - The workflow's nodes.
 * @param edges - The workflow's edges.
 * @param inputData - Initial input data passed to the trigger node.
 */
export async function runWorkflow(
  executionId: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  inputData: Record<string, unknown>
): Promise<void> {
  const execution = await prisma.execution.findUnique({
    where: { id: executionId },
    select: { workflowId: true },
  })
  const workflowId = execution?.workflowId ?? ''

  try {
    await prisma.execution.update({
      where: { id: executionId },
      data: { status: 'RUNNING', startedAt: new Date() },
    })

    if (hasCycle(nodes, edges)) {
      await prisma.execution.update({
        where: { id: executionId },
        data: { status: 'ERROR', finishedAt: new Date() },
      })
      logger.warn({ executionId }, 'Workflow has a cycle — aborting execution')
      return
    }

    const sortedNodes = buildExecutionOrder(nodes, edges)
    const context = createExecutionContext(executionId, workflowId)
    const vars = await loadWorkspaceVars(workflowId)

    // Precompute edge lookup maps for O(1) access per node
    const incomingEdgesMap = new Map<string, WorkflowEdge[]>()
    const outgoingEdgesMap = new Map<string, WorkflowEdge[]>()
    for (const node of nodes) {
      incomingEdgesMap.set(node.id, [])
      outgoingEdgesMap.set(node.id, [])
    }
    for (const edge of edges) {
      incomingEdgesMap.get(edge.target)?.push(edge)
      outgoingEdgesMap.get(edge.source)?.push(edge)
    }

    // Tracks which edges are "live" — only nodes with a live incoming edge execute
    const activeEdgeIds = new Set<string>()
    let failed = false

    for (const node of sortedNodes) {
      const nodeIncoming = incomingEdgesMap.get(node.id) ?? []
      const isTrigger = nodeIncoming.length === 0
      const hasActiveIncoming = nodeIncoming.some((e) =>
        activeEdgeIds.has(e.id)
      )

      if (!isTrigger && !hasActiveIncoming) {
        // Node is on a dead branch — mark SKIPPED without executing
        await prisma.executionNodeRun
          .updateMany({
            where: { executionId, nodeId: node.id },
            data: { status: 'SKIPPED', finishedAt: new Date() },
          })
          .catch((err) =>
            logger.error(
              { executionId, nodeId: node.id, err },
              'Failed to mark node SKIPPED'
            )
          )
        continue
      }

      const nodeRun = await prisma.executionNodeRun.findFirst({
        where: { executionId, nodeId: node.id },
      })
      if (!nodeRun) {
        logger.error(
          { executionId, nodeId: node.id },
          'ExecutionNodeRun record missing — skipping node'
        )
        continue
      }

      await prisma.executionNodeRun.update({
        where: { id: nodeRun.id },
        data: { status: 'RUNNING', startedAt: new Date() },
      })

      // Resolve input: merge collects all active upstream outputs;
      // all other nodes use the most recent active upstream output.
      const activeIncoming = nodeIncoming.filter((e) => activeEdgeIds.has(e.id))
      let nodeInputData: Record<string, unknown>
      if (isTrigger) {
        nodeInputData = inputData
      } else if (node.type === 'merge') {
        nodeInputData = {
          inputs: activeIncoming.map(
            (e) => context.nodeOutputs[e.source] ?? {}
          ),
        }
      } else {
        const lastEdge = activeIncoming[activeIncoming.length - 1]
        nodeInputData =
          lastEdge && context.nodeOutputs[lastEdge.source]
            ? context.nodeOutputs[lastEdge.source]
            : inputData
      }

      const executor = getExecutor(node.type)
      if (!executor) {
        await prisma.executionNodeRun.update({
          where: { id: nodeRun.id },
          data: {
            status: 'ERROR',
            error: `Unknown node type: ${node.type}`,
            inputData: toJson(nodeInputData),
            finishedAt: new Date(),
          },
        })
        failed = true
        break
      }

      // Parse per-node error config (defaults: policy=stop, no retries, no error branch)
      const errorConfigResult = NodeErrorConfigSchema.safeParse(
        node.data.errorConfig ?? {}
      )
      const errorConfig = errorConfigResult.success
        ? errorConfigResult.data
        : {
            policy: 'stop' as const,
            retryCount: 1,
            retryDelayMs: 1000,
            errorBranch: false,
          }

      const maxAttempts =
        errorConfig.policy === 'retry' ? errorConfig.retryCount + 1 : 1

      let successOutput: Record<string, unknown> | null = null
      let lastErrorMessage: string | null = null

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (attempt > 0) {
          await prisma.executionNodeRun.update({
            where: { id: nodeRun.id },
            data: { retryCount: attempt },
          })
          if (errorConfig.retryDelayMs > 0) {
            await new Promise<void>((resolve) =>
              setTimeout(resolve, errorConfig.retryDelayMs)
            )
          }
        }

        try {
          const resolvedNodeData = resolveVariables(
            node.data,
            vars,
            nodeInputData
          )
          const output = await executor.execute(
            resolvedNodeData,
            nodeInputData,
            context
          )
          successOutput = output
          lastErrorMessage = null
          break
        } catch (err) {
          lastErrorMessage = err instanceof Error ? err.message : String(err)
          logger.warn(
            { executionId, nodeId: node.id, attempt },
            'Node attempt failed'
          )
        }
      }

      const nodeOutgoing = outgoingEdgesMap.get(node.id) ?? []

      if (successOutput !== null) {
        context.nodeOutputs[node.id] = successOutput

        await prisma.executionNodeRun.update({
          where: { id: nodeRun.id },
          data: {
            status: 'SUCCESS',
            inputData: toJson(nodeInputData),
            outputData: toJson(successOutput),
            finishedAt: new Date(),
          },
        })

        // Activate outgoing edges — branching nodes only activate the matched handle;
        // error handle edges are never activated on success
        if (BRANCHING_TYPES.has(node.type)) {
          const activeHandle = successOutput[BRANCH_HANDLE_KEY]
          if (typeof activeHandle === 'string') {
            for (const edge of nodeOutgoing) {
              if (edge.sourceHandle === activeHandle) {
                activeEdgeIds.add(edge.id)
              }
            }
          }
        } else {
          for (const edge of nodeOutgoing) {
            if (edge.sourceHandle !== ERROR_HANDLE_ID) {
              activeEdgeIds.add(edge.id)
            }
          }
        }
      } else {
        // All attempts failed
        logger.error({ executionId, nodeId: node.id }, 'Node execution failed')

        await prisma.executionNodeRun.update({
          where: { id: nodeRun.id },
          data: {
            status: 'ERROR',
            error: lastErrorMessage,
            inputData: toJson(nodeInputData),
            retryCount: maxAttempts - 1,
            finishedAt: new Date(),
          },
        })

        context.nodeOutputs[node.id] = { _error: lastErrorMessage }

        // Activate error branch edges if the node has errorBranch enabled
        if (errorConfig.errorBranch) {
          for (const edge of nodeOutgoing) {
            if (edge.sourceHandle === ERROR_HANDLE_ID) {
              activeEdgeIds.add(edge.id)
            }
          }
        }

        if (errorConfig.policy === 'continue') {
          // Activate normal outgoing edges so the main flow continues with empty data
          for (const edge of nodeOutgoing) {
            if (edge.sourceHandle !== ERROR_HANDLE_ID) {
              activeEdgeIds.add(edge.id)
            }
          }
        } else {
          // stop (includes retry-exhausted): mark execution failed
          failed = true
          if (!errorConfig.errorBranch) {
            // No error branch to follow — short-circuit remaining nodes
            break
          }
          // Error branch present: don't break so its downstream nodes can execute
        }
      }
    }

    await prisma.execution.update({
      where: { id: executionId },
      data: { status: failed ? 'ERROR' : 'SUCCESS', finishedAt: new Date() },
    })
  } catch (err) {
    logger.error({ executionId, err }, 'Unexpected error in runWorkflow')
    await prisma.execution
      .update({
        where: { id: executionId },
        data: { status: 'ERROR', finishedAt: new Date() },
      })
      .catch(() => undefined)
  }
}
