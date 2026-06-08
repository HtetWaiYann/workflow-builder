import { describe, it, expect } from 'vitest'
import { ManualTriggerExecutor } from './manualTriggerExecutor'
import { CronTriggerExecutor } from './cronTriggerExecutor'
import { WebhookTriggerExecutor } from './webhookTriggerExecutor'
import type { ExecutionContext } from '@triggr/shared'

const ctx: ExecutionContext = {
  executionId: 'exec-1',
  workflowId: 'wf-1',
  nodeOutputs: {},
}

// All three trigger executors are pass-throughs that return inputData unchanged.
// Their type discriminant is tested to ensure registry registration works correctly.

describe('ManualTriggerExecutor', () => {
  const executor = new ManualTriggerExecutor()

  it('has type "manual-trigger"', () => {
    expect(executor.type).toBe('manual-trigger')
  })

  it('returns inputData unchanged', async () => {
    const input = { key: 'value', count: 42 }
    const output = await executor.execute({}, input, ctx)
    expect(output).toEqual(input)
  })

  it('returns the same reference as inputData', async () => {
    const input = { x: 1 }
    const output = await executor.execute({ config: {} }, input, ctx)
    expect(output).toBe(input)
  })

  it('handles empty inputData', async () => {
    const output = await executor.execute({}, {}, ctx)
    expect(output).toEqual({})
  })
})

describe('CronTriggerExecutor', () => {
  const executor = new CronTriggerExecutor()

  it('has type "cron-trigger"', () => {
    expect(executor.type).toBe('cron-trigger')
  })

  it('returns inputData unchanged', async () => {
    const input = { scheduledAt: '2024-01-01T00:00:00Z' }
    const output = await executor.execute(
      { config: { schedule: '0 * * * *' } },
      input,
      ctx
    )
    expect(output).toEqual(input)
  })

  it('handles empty inputData', async () => {
    const output = await executor.execute({}, {}, ctx)
    expect(output).toEqual({})
  })
})

describe('WebhookTriggerExecutor', () => {
  const executor = new WebhookTriggerExecutor()

  it('has type "webhook-trigger"', () => {
    expect(executor.type).toBe('webhook-trigger')
  })

  it('returns inputData unchanged', async () => {
    const input = {
      body: { event: 'push' },
      headers: { 'x-github-event': 'push' },
    }
    const output = await executor.execute({}, input, ctx)
    expect(output).toEqual(input)
  })

  it('handles empty inputData', async () => {
    const output = await executor.execute({}, {}, ctx)
    expect(output).toEqual({})
  })
})
