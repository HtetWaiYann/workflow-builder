import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SlackMessageExecutor } from './slackMessageExecutor'
import type { ExecutionContext } from '@workflow-builder/shared'

vi.mock('../../lib/logger', () => ({
  logger: { warn: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() },
}))

const ctx: ExecutionContext = {
  executionId: 'exec-1',
  workflowId: 'wf-1',
  nodeOutputs: {},
}

const executor = new SlackMessageExecutor()

const validConfig = {
  config: {
    webhookUrl: 'https://hooks.slack.com/services/TEST',
    message: 'Hello from workflow!',
  },
}

function makeSlackResponse(ok: boolean, status = ok ? 200 : 400) {
  return {
    ok,
    status,
    text: vi.fn().mockResolvedValue(ok ? 'ok' : 'invalid_payload'),
  } as unknown as Response
}

// Posts a message to a Slack incoming webhook URL.
// Returns inputData enriched with slackSent: true on success.
describe('SlackMessageExecutor', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(makeSlackResponse(true))
  })

  it('has type "slack-message"', () => {
    expect(executor.type).toBe('slack-message')
  })

  it('POSTs to the configured webhook URL with the message text', async () => {
    await executor.execute(validConfig, {}, ctx)

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://hooks.slack.com/services/TEST',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ text: 'Hello from workflow!' }),
      })
    )
  })

  it('sets Content-Type to application/json', async () => {
    await executor.execute(validConfig, {}, ctx)
    const init = vi.mocked(globalThis.fetch).mock.calls[0]?.[1] as RequestInit
    expect((init.headers as Record<string, string>)['Content-Type']).toBe(
      'application/json'
    )
  })

  it('returns inputData with slackSent: true on success', async () => {
    const out = await executor.execute(validConfig, { upstream: 'data' }, ctx)
    expect(out['slackSent']).toBe(true)
    expect(out['upstream']).toBe('data')
  })

  it('throws when the Slack webhook returns a non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      makeSlackResponse(false, 400)
    )
    await expect(executor.execute(validConfig, {}, ctx)).rejects.toThrow(
      'Slack webhook returned 400'
    )
  })

  it('throws on invalid config (missing webhookUrl)', async () => {
    await expect(
      executor.execute({ config: { message: 'hi' } }, {}, ctx)
    ).rejects.toThrow('Invalid slack-message config')
  })

  it('throws on invalid config (missing config key)', async () => {
    await expect(executor.execute({}, {}, ctx)).rejects.toThrow(
      'Invalid slack-message config'
    )
  })
})
