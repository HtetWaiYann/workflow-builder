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

  it('returns undefined for an unknown type', () => {
    expect(getExecutor('http-request')).toBeUndefined()
    expect(getExecutor('run-js')).toBeUndefined()
    expect(getExecutor('')).toBeUndefined()
  })
})
