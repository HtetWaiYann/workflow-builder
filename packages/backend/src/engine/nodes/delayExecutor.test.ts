import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DelayExecutor } from './delayExecutor'
import type { ExecutionContext } from '@workflow-builder/shared'

vi.mock('../../lib/logger', () => ({
  logger: { warn: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() },
}))

const ctx: ExecutionContext = {
  executionId: 'exec-1',
  workflowId: 'wf-1',
  nodeOutputs: {},
}

const executor = new DelayExecutor()

// Pauses execution for the configured duration then passes inputData through unchanged.
// Rejects when the requested delay exceeds MAX_DELAY_MS.
describe('DelayExecutor', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    delete process.env['MAX_DELAY_MS']
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('has type "delay"', () => {
    expect(executor.type).toBe('delay')
  })

  it('returns inputData unchanged after the delay', async () => {
    const input = { x: 1, y: 'hello' }
    const promise = executor.execute(
      { config: { duration: 2, unit: 'seconds' } },
      input,
      ctx
    )
    await vi.advanceTimersByTimeAsync(2000)
    const out = await promise
    expect(out).toBe(input)
  })

  it('waits the correct number of milliseconds for seconds unit', async () => {
    const promise = executor.execute(
      { config: { duration: 3, unit: 'seconds' } },
      {},
      ctx
    )
    await vi.advanceTimersByTimeAsync(2999)
    // Not yet resolved — advance the last ms
    await vi.advanceTimersByTimeAsync(1)
    await expect(promise).resolves.toEqual({})
  })

  it('waits the correct duration for minutes unit', async () => {
    const promise = executor.execute(
      { config: { duration: 1, unit: 'minutes' } },
      {},
      ctx
    )
    await vi.advanceTimersByTimeAsync(60_000)
    await expect(promise).resolves.toEqual({})
  })

  it('waits the correct duration for hours unit', async () => {
    // Allow 4-hour max so 1-hour delay does not hit the default 5-minute cap
    process.env['MAX_DELAY_MS'] = String(4 * 3_600_000)
    const promise = executor.execute(
      { config: { duration: 1, unit: 'hours' } },
      {},
      ctx
    )
    await vi.advanceTimersByTimeAsync(3_600_000)
    await expect(promise).resolves.toEqual({})
  })

  it('throws when delay exceeds the default maximum of 5 minutes', async () => {
    await expect(
      executor.execute({ config: { duration: 6, unit: 'minutes' } }, {}, ctx)
    ).rejects.toThrow('exceeds the maximum allowed delay')
  })

  it('throws when delay exceeds a custom MAX_DELAY_MS env value', async () => {
    process.env['MAX_DELAY_MS'] = '5000'
    await expect(
      executor.execute({ config: { duration: 10, unit: 'seconds' } }, {}, ctx)
    ).rejects.toThrow('exceeds the maximum allowed delay')
  })

  it('allows a delay exactly equal to MAX_DELAY_MS', async () => {
    process.env['MAX_DELAY_MS'] = '5000'
    const promise = executor.execute(
      { config: { duration: 5, unit: 'seconds' } },
      {},
      ctx
    )
    await vi.advanceTimersByTimeAsync(5000)
    await expect(promise).resolves.toEqual({})
  })

  it('throws on invalid config (missing unit)', async () => {
    await expect(
      executor.execute({ config: { duration: 1 } }, {}, ctx)
    ).rejects.toThrow('Invalid delay config')
  })

  it('throws on invalid config (non-positive duration)', async () => {
    await expect(
      executor.execute({ config: { duration: 0, unit: 'seconds' } }, {}, ctx)
    ).rejects.toThrow('Invalid delay config')
  })
})
