import { describe, it, expect } from 'vitest'
import { WebhookTriggerExecutor } from './webhookTriggerExecutor'
import type { ExecutionContext } from '@triggr/shared'

const ctx: ExecutionContext = {
  executionId: 'exec-1',
  workflowId: 'wf-1',
  nodeOutputs: {},
}

// Trigger executor for webhook-initiated workflows.
// Passes the incoming request payload through as the initial node output.
describe('WebhookTriggerExecutor', () => {
  it('has type "webhook-trigger"', () => {
    expect(new WebhookTriggerExecutor().type).toBe('webhook-trigger')
  })

  it('returns the input data unchanged', async () => {
    const input = {
      body: { event: 'push' },
      headers: { 'x-hub-signature': 'abc' },
    }
    const out = await new WebhookTriggerExecutor().execute({}, input, ctx)
    expect(out).toEqual(input)
  })
})
