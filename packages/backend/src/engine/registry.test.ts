import { describe, it, expect } from 'vitest'
import { getExecutor } from './registry'

// Looks up a registered NodeExecutor by node type string. Returns undefined for unknown
// types so the runner can surface a clear "Unknown node type" error to the execution log.
describe('getExecutor', () => {
  it('returns the NoOpExecutor for type "no-op"', () => {
    const executor = getExecutor('no-op')
    expect(executor).toBeDefined()
    expect(executor?.type).toBe('no-op')
  })

  it('returns executors for all 14 registered node types', () => {
    const registeredTypes = [
      'manual-trigger',
      'webhook-trigger',
      'cron-trigger',
      'http-request',
      'run-js-code',
      'if-condition',
      'switch',
      'merge',
      'set-fields',
      'filter-array',
      'rename-keys',
      'slack-message',
      'send-email',
      'delay',
    ]
    for (const type of registeredTypes) {
      const executor = getExecutor(type)
      expect(executor, `expected executor for type "${type}"`).toBeDefined()
      expect(executor?.type).toBe(type)
    }
  })

  it('returns undefined for unknown types', () => {
    expect(getExecutor('not-a-real-type')).toBeUndefined()
    expect(getExecutor('unknown-executor')).toBeUndefined()
    expect(getExecutor('')).toBeUndefined()
  })
})
