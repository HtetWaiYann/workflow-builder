import { describe, it, expect } from 'vitest'
import { CronTriggerExecutor } from './cronTriggerExecutor'
import type { ExecutionContext } from '@triggr/shared'

const ctx: ExecutionContext = {
  executionId: 'exec-1',
  workflowId: 'wf-1',
  nodeOutputs: {},
}

// Trigger executor for scheduled (cron) workflows.
// Passes input data through — the cron runner provides no data payload.
describe('CronTriggerExecutor', () => {
  it('has type "cron-trigger"', () => {
    expect(new CronTriggerExecutor().type).toBe('cron-trigger')
  })

  it('returns the input data unchanged', async () => {
    const input = { triggeredAt: '2024-01-01T00:00:00Z' }
    const out = await new CronTriggerExecutor().execute({}, input, ctx)
    expect(out).toEqual(input)
  })
})
