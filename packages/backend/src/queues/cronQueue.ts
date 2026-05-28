import { Queue } from 'bullmq'
import type { ConnectionOptions } from 'bullmq'

export const CRON_QUEUE_NAME = 'workflow-cron'

export interface CronJobData {
  workflowId: string
}

let _cronQueue: Queue<CronJobData> | null = null

/**
 * Returns BullMQ connection options built from REDIS_URL.
 * Uses a plain options object to avoid ioredis version conflicts with BullMQ's bundled copy.
 *
 * @throws If REDIS_URL is not set.
 */
export function getRedisConnection(): ConnectionOptions {
  const url = process.env.REDIS_URL
  if (!url) throw new Error('REDIS_URL environment variable is not set')
  return { url, maxRetriesPerRequest: null } as ConnectionOptions
}

/** Returns the singleton cron queue, creating it on first call. */
export function getCronQueue(): Queue<CronJobData> {
  if (!_cronQueue) {
    _cronQueue = new Queue<CronJobData>(CRON_QUEUE_NAME, {
      connection: getRedisConnection(),
    })
  }
  return _cronQueue
}
