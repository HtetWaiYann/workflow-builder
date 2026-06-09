import { Worker } from 'bullmq'
import { z } from 'zod'
import {
  WorkflowNodeSchema,
  WorkflowEdgeSchema,
} from '@triggr/shared'
import { prisma } from '../db/client'
import { logger } from '../lib/logger'
import { runWorkflow } from '../engine/runner'
import { CRON_QUEUE_NAME, getRedisConnection } from './cronQueue'
import type { CronJobData } from './cronQueue'

/**
 * Starts the BullMQ worker that processes cron-triggered workflow jobs.
 * Each job loads the workflow, creates Execution + ExecutionNodeRun records,
 * and fires runWorkflow fire-and-forget.
 *
 * @returns The Worker instance — call worker.close() on graceful shutdown.
 */
export function startCronWorker(): Worker<CronJobData> {
  const worker = new Worker<CronJobData>(
    CRON_QUEUE_NAME,
    async (job) => {
      const { workflowId } = job.data

      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
      })

      if (!workflow || workflow.status !== 'ACTIVE') {
        logger.warn(
          { workflowId },
          'Cron job fired for inactive or missing workflow — skipping'
        )
        return
      }

      const nodes = z.array(WorkflowNodeSchema).catch([]).parse(workflow.nodes)
      const edges = z.array(WorkflowEdgeSchema).catch([]).parse(workflow.edges)

      const execution = await prisma.$transaction(async (tx) => {
        const exec = await tx.execution.create({
          data: { workflowId, status: 'PENDING', inputData: {} },
        })
        if (nodes.length > 0) {
          await tx.executionNodeRun.createMany({
            data: nodes.map((n) => ({
              executionId: exec.id,
              nodeId: n.id,
              status: 'PENDING' as const,
            })),
          })
        }
        return exec
      })

      void runWorkflow(execution.id, nodes, edges, {})
      logger.info(
        { workflowId, executionId: execution.id },
        'Cron workflow triggered'
      )
    },
    { connection: getRedisConnection() }
  )

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Cron worker job failed')
  })

  return worker
}
