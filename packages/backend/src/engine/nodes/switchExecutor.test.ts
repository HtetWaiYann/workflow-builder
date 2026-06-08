import { describe, it, expect } from 'vitest'
import { SwitchExecutor } from './switchExecutor'
import { BRANCH_HANDLE_KEY } from '@triggr/shared'
import type { ExecutionContext } from '@triggr/shared'

const ctx: ExecutionContext = {
  executionId: 'exec-1',
  workflowId: 'wf-1',
  nodeOutputs: {},
}

const executor = new SwitchExecutor()

const cases = [
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
]

function cfg(field: string) {
  return { config: { field, cases } }
}

// Routes execution to case1/case2/... handles based on positional case matching,
// falling back to "default" when no case value equals the field value.
describe('SwitchExecutor', () => {
  it('has type "switch"', () => {
    expect(executor.type).toBe('switch')
  })

  it('routes to case1 when the first case matches', async () => {
    const out = await executor.execute(cfg('color'), { color: 'red' }, ctx)
    expect(out[BRANCH_HANDLE_KEY]).toBe('case1')
  })

  it('routes to case2 when the second case matches', async () => {
    const out = await executor.execute(cfg('color'), { color: 'green' }, ctx)
    expect(out[BRANCH_HANDLE_KEY]).toBe('case2')
  })

  it('routes to case3 when the third case matches', async () => {
    const out = await executor.execute(cfg('color'), { color: 'blue' }, ctx)
    expect(out[BRANCH_HANDLE_KEY]).toBe('case3')
  })

  it('routes to "default" when no case matches', async () => {
    const out = await executor.execute(cfg('color'), { color: 'yellow' }, ctx)
    expect(out[BRANCH_HANDLE_KEY]).toBe('default')
  })

  it('routes to "default" when the field is missing', async () => {
    const out = await executor.execute(cfg('missing'), {}, ctx)
    expect(out[BRANCH_HANDLE_KEY]).toBe('default')
  })

  it('includes field and fieldValue in the output', async () => {
    const out = await executor.execute(cfg('color'), { color: 'red' }, ctx)
    expect(out['field']).toBe('color')
    expect(out['fieldValue']).toBe('red')
  })

  it('sets matchedCase to the matched case object', async () => {
    const out = await executor.execute(cfg('color'), { color: 'green' }, ctx)
    expect(out['matchedCase']).toEqual({ value: 'green', label: 'Green' })
  })

  it('sets matchedCase to null for the default route', async () => {
    const out = await executor.execute(cfg('color'), { color: 'purple' }, ctx)
    expect(out['matchedCase']).toBeNull()
  })

  it('coerces numeric field values to string before matching', async () => {
    const numCases = [{ value: '42', label: 'Forty-two' }]
    const out = await executor.execute(
      { config: { field: 'n', cases: numCases } },
      { n: 42 },
      ctx
    )
    expect(out[BRANCH_HANDLE_KEY]).toBe('case1')
  })

  it('throws on invalid config (missing field)', async () => {
    await expect(
      executor.execute({ config: { cases } }, {}, ctx)
    ).rejects.toThrow('Invalid switch config')
  })
})
