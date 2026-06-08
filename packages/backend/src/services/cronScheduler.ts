import { z } from 'zod'
import { WorkflowNodeSchema } from '@triggr/shared'
import { getCronQueue } from '../queues/cronQueue'
import { logger } from '../lib/logger'

const cronJobId = (workflowId: string) => `cron-workflow-${workflowId}`

// Matches each individual cron field: *, numbers, ranges (1-5), lists (1,2),
// steps (*/5 or 1-5/2). Intentionally lenient — catches obvious garbage.
const CRON_FIELD = /^(\*|[0-9]+([-,][0-9]+)*(\/[0-9]+)?|\*\/[0-9]+)$/

/**
 * Returns true when the schedule string is a syntactically plausible standard
 * 5-field cron expression (minute hour dom month dow).
 *
 * 6-field (seconds-level) expressions are rejected outright — they allow
 * sub-minute scheduling that would flood the execution engine.
 */
function isValidCronExpression(schedule: string): boolean {
  const fields = schedule.trim().split(/\s+/)
  if (fields.length !== 5) return false
  return fields.every((f) => CRON_FIELD.test(f))
}

/**
 * Schedules a repeatable BullMQ job for a workflow's cron-trigger node.
 * Idempotent — removes any existing job before scheduling a new one.
 * No-op if the workflow has no cron-trigger node or the node has no valid schedule.
 *
 * @param workflowId - The workflow to schedule.
 * @param nodesJson - Raw nodes JSON from the Workflow DB record.
 */
export async function scheduleCronWorkflow(
  workflowId: string,
  nodesJson: unknown
): Promise<void> {
  const nodes = z.array(WorkflowNodeSchema).catch([]).parse(nodesJson)
  const cronNode = nodes.find((n) => n.type === 'cron-trigger')
  if (!cronNode) return

  const configResult = z
    .object({ schedule: z.string().min(1) })
    .safeParse(cronNode.data['config'])

  if (!configResult.success) {
    logger.warn(
      { workflowId },
      'cron-trigger node has missing or invalid schedule'
    )
    return
  }

  if (!isValidCronExpression(configResult.data.schedule)) {
    logger.warn(
      { workflowId, schedule: configResult.data.schedule },
      'cron-trigger schedule is invalid or uses sub-minute (6-field) syntax — not scheduled'
    )
    return
  }

  const queue = getCronQueue()
  const jobId = cronJobId(workflowId)

  // Remove any prior repeatable job for this workflow before adding
  await removeCronWorkflow(workflowId)

  await queue.add(
    jobId,
    { workflowId },
    {
      repeat: { pattern: configResult.data.schedule },
      jobId,
    }
  )

  logger.info(
    { workflowId, schedule: configResult.data.schedule },
    'Cron workflow scheduled'
  )
}

/**
 * Removes the repeatable BullMQ job for a workflow.
 * No-op if no job exists for this workflow.
 *
 * @param workflowId - The workflow whose cron job should be removed.
 */
export async function removeCronWorkflow(workflowId: string): Promise<void> {
  const queue = getCronQueue()
  const jobId = cronJobId(workflowId)

  const repeatableJobs = await queue.getRepeatableJobs()
  const existing = repeatableJobs.find(
    (j) => j.id === jobId || j.name === jobId
  )

  if (existing?.key) {
    await queue.removeRepeatableByKey(existing.key)
    logger.info({ workflowId }, 'Cron workflow unscheduled')
  }
}
