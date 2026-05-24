import { describe, it, expect } from 'vitest'
import { getExecutor } from './registry'

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
