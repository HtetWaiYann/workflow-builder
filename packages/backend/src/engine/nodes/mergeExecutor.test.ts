import { describe, it, expect } from 'vitest'
import { MergeExecutor } from './mergeExecutor'
import type { ExecutionContext } from '@workflow-builder/shared'

const ctx: ExecutionContext = {
  executionId: 'exec-1',
  workflowId: 'wf-1',
  nodeOutputs: {},
}

const executor = new MergeExecutor()

// Combines multiple upstream branch outputs into a single flat object.
// Falls back to spreading inputData directly when there is no inputs array.
describe('MergeExecutor', () => {
  it('has type "merge"', () => {
    expect(executor.type).toBe('merge')
  })

  it('merges an inputs array into a single object', async () => {
    const output = await executor.execute(
      {},
      { inputs: [{ a: 1 }, { b: 2 }, { c: 3 }] },
      ctx
    )
    expect(output).toEqual({ a: 1, b: 2, c: 3 })
  })

  it('later inputs overwrite earlier ones when keys collide', async () => {
    const output = await executor.execute(
      {},
      { inputs: [{ x: 'first' }, { x: 'second' }] },
      ctx
    )
    expect(output['x']).toBe('second')
  })

  it('returns an empty object when inputs is an empty array', async () => {
    const output = await executor.execute({}, { inputs: [] }, ctx)
    expect(output).toEqual({})
  })

  it('falls back to spreading inputData when there is no inputs key', async () => {
    const input = { foo: 'bar', count: 7 }
    const output = await executor.execute({}, input, ctx)
    expect(output).toEqual({ foo: 'bar', count: 7 })
  })

  it('falls back gracefully when inputs is not an array', async () => {
    const input = { inputs: 'not-an-array', extra: true }
    const output = await executor.execute({}, input, ctx)
    expect(output).toMatchObject({ inputs: 'not-an-array', extra: true })
  })

  it('handles a single-element inputs array', async () => {
    const output = await executor.execute(
      {},
      { inputs: [{ only: 'one' }] },
      ctx
    )
    expect(output).toEqual({ only: 'one' })
  })
})
