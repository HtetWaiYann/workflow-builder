import type { WorkflowNode, WorkflowEdge } from '@workflow-builder/shared'
import { BRANCH_HANDLE_KEY } from '@workflow-builder/shared'
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

      try {
        const resolvedNodeData = resolveVariables(node.data, vars)
        const output = await executor.execute(
          resolvedNodeData,
          nodeInputData,
          context
        )
        context.nodeOutputs[node.id] = output

        await prisma.executionNodeRun.update({
          where: { id: nodeRun.id },
          data: {
            status: 'SUCCESS',
            inputData: toJson(nodeInputData),
            outputData: toJson(output),
            finishedAt: new Date(),
          },
        })

        // Activate outgoing edges — branching nodes only activate the matched handle
        const nodeOutgoing = outgoingEdgesMap.get(node.id) ?? []
        if (BRANCHING_TYPES.has(node.type)) {
          const activeHandle = output[BRANCH_HANDLE_KEY]
          if (typeof activeHandle === 'string') {
            for (const edge of nodeOutgoing) {
              if (edge.sourceHandle === activeHandle) {
                activeEdgeIds.add(edge.id)
              }
            }
          }
        } else {
          for (const edge of nodeOutgoing) {
            activeEdgeIds.add(edge.id)
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        logger.error(
          { executionId, nodeId: node.id, err },
          'Node execution failed'
        )

        await prisma.executionNodeRun.update({
          where: { id: nodeRun.id },
          data: {
            status: 'ERROR',
            error: message,
            inputData: toJson(nodeInputData),
            finishedAt: new Date(),
          },
        })
        failed = true
        break
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
