import { describe, it, expect } from 'vitest'
import { createExecutionContext } from './context'

describe('createExecutionContext', () => {
  it('sets executionId and workflowId from arguments', () => {
    const ctx = createExecutionContext('exec-1', 'wf-1')
    expect(ctx.executionId).toBe('exec-1')
    expect(ctx.workflowId).toBe('wf-1')
  })

  it('initialises nodeOutputs as an empty object', () => {
    const ctx = createExecutionContext('exec-1', 'wf-1')
    expect(ctx.nodeOutputs).toEqual({})
  })

  it('creates independent contexts with no shared nodeOutputs reference', () => {
    const ctx1 = createExecutionContext('exec-1', 'wf-1')
    const ctx2 = createExecutionContext('exec-2', 'wf-2')
    ctx1.nodeOutputs['node-a'] = { result: 1 }
    expect(ctx2.nodeOutputs['node-a']).toBeUndefined()
  })
})
