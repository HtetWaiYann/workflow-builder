import { describe, it, expect } from 'vitest'
import { NoOpExecutor } from './noOpExecutor'
import type { ExecutionContext } from '@workflow-builder/shared'

const ctx: ExecutionContext = {
  executionId: 'exec-1',
  workflowId: 'wf-1',
  nodeOutputs: {},
}

describe('NoOpExecutor', () => {
  const executor = new NoOpExecutor()

  it('has type "no-op"', () => {
    expect(executor.type).toBe('no-op')
  })

  it('returns the inputData unchanged', async () => {
    const input = { key: 'value', count: 42 }
    const output = await executor.execute({}, input, ctx)
    expect(output).toEqual(input)
  })

  it('returns the same reference as inputData', async () => {
    const input = { x: 1 }
    const output = await executor.execute({ config: true }, input, ctx)
    expect(output).toBe(input)
  })

  it('handles empty inputData', async () => {
    const output = await executor.execute({}, {}, ctx)
    expect(output).toEqual({})
  })

  it('ignores nodeData entirely', async () => {
    const input = { a: 1 }
    const output = await executor.execute({ irrelevant: 'config' }, input, ctx)
    expect(output).toEqual({ a: 1 })
  })
})
