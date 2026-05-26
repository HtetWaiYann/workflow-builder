import type { WorkflowNode, WorkflowEdge } from '@workflow-builder/shared'
import type { Prisma } from '../generated/prisma/client'
import { prisma } from '../db/client'
import { logger } from '../lib/logger'
import { buildExecutionOrder, hasCycle } from './dag'
import { getExecutor } from './registry'
import { createExecutionContext } from './context'

const toJson = (v: Record<string, unknown>): Prisma.InputJsonValue =>
  v as unknown as Prisma.InputJsonValue

/**
 * Executes a workflow by running each node in topological order.
 * Updates ExecutionNodeRun and Execution rows in Prisma as execution proceeds.
 * Never throws — all errors are caught and written to the database.
 *
 * @param executionId - The Execution record id to update throughout the run.
 * @param nodes - The workflow's nodes.
 * @param edges - The workflow's edges.
 * @param inputData - Initial input data passed to the first node.
 */
export async function runWorkflow(
  executionId: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  inputData: Record<string, unknown>
): Promise<void> {
  const workflowId = await prisma.execution
    .findUnique({ where: { id: executionId }, select: { workflowId: true } })
    .then((e) => e?.workflowId ?? '')

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
    let failed = false

    for (const node of sortedNodes) {
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

      const upstreamEdge = edges.find((e) => e.target === node.id)
      const nodeInputData: Record<string, unknown> =
        upstreamEdge && context.nodeOutputs[upstreamEdge.source]
          ? context.nodeOutputs[upstreamEdge.source]
          : inputData

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
        const output = await executor.execute(node.data, nodeInputData, context)
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
