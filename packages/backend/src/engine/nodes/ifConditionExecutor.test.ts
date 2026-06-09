import { describe, it, expect } from 'vitest'
import { IfConditionExecutor } from './ifConditionExecutor'
import { BRANCH_HANDLE_KEY } from '@triggr/shared'
import type { ExecutionContext } from '@triggr/shared'

const ctx: ExecutionContext = {
  executionId: 'exec-1',
  workflowId: 'wf-1',
  nodeOutputs: {},
}

const executor = new IfConditionExecutor()

function cfg(field: string, operator: string, value: unknown) {
  return { config: { field, operator, value } }
}

// Evaluates a single condition against the input object and routes execution
// to either the "true" or "false" branch via BRANCH_HANDLE_KEY.
describe('IfConditionExecutor', () => {
  it('has type "if-condition"', () => {
    expect(executor.type).toBe('if-condition')
  })

  it('sets BRANCH_HANDLE_KEY to "true" when == matches', async () => {
    const out = await executor.execute(
      cfg('status', '==', 'active'),
      { status: 'active' },
      ctx
    )
    expect(out[BRANCH_HANDLE_KEY]).toBe('true')
    expect(out['result']).toBe(true)
  })

  it('sets BRANCH_HANDLE_KEY to "false" when == does not match', async () => {
    const out = await executor.execute(
      cfg('status', '==', 'inactive'),
      { status: 'active' },
      ctx
    )
    expect(out[BRANCH_HANDLE_KEY]).toBe('false')
    expect(out['result']).toBe(false)
  })

  it('evaluates != operator', async () => {
    const out = await executor.execute(cfg('x', '!=', 5), { x: 3 }, ctx)
    expect(out[BRANCH_HANDLE_KEY]).toBe('true')
  })

  it('evaluates > operator', async () => {
    const trueOut = await executor.execute(cfg('n', '>', 10), { n: 15 }, ctx)
    expect(trueOut[BRANCH_HANDLE_KEY]).toBe('true')

    const falseOut = await executor.execute(cfg('n', '>', 10), { n: 5 }, ctx)
    expect(falseOut[BRANCH_HANDLE_KEY]).toBe('false')
  })

  it('evaluates < operator', async () => {
    const out = await executor.execute(cfg('n', '<', 10), { n: 3 }, ctx)
    expect(out[BRANCH_HANDLE_KEY]).toBe('true')
  })

  it('evaluates >= operator', async () => {
    const eqOut = await executor.execute(cfg('n', '>=', 5), { n: 5 }, ctx)
    expect(eqOut[BRANCH_HANDLE_KEY]).toBe('true')

    const ltOut = await executor.execute(cfg('n', '>=', 5), { n: 4 }, ctx)
    expect(ltOut[BRANCH_HANDLE_KEY]).toBe('false')
  })

  it('evaluates <= operator', async () => {
    const eqOut = await executor.execute(cfg('n', '<=', 5), { n: 5 }, ctx)
    expect(eqOut[BRANCH_HANDLE_KEY]).toBe('true')

    const gtOut = await executor.execute(cfg('n', '<=', 5), { n: 6 }, ctx)
    expect(gtOut[BRANCH_HANDLE_KEY]).toBe('false')
  })

  it('evaluates "contains" operator', async () => {
    const out = await executor.execute(
      cfg('msg', 'contains', 'hello'),
      { msg: 'say hello world' },
      ctx
    )
    expect(out[BRANCH_HANDLE_KEY]).toBe('true')

    const falseOut = await executor.execute(
      cfg('msg', 'contains', 'bye'),
      { msg: 'say hello world' },
      ctx
    )
    expect(falseOut[BRANCH_HANDLE_KEY]).toBe('false')
  })

  it('evaluates "not contains" operator', async () => {
    const out = await executor.execute(
      cfg('msg', 'not contains', 'bye'),
      { msg: 'hello world' },
      ctx
    )
    expect(out[BRANCH_HANDLE_KEY]).toBe('true')
  })

  it('includes field and fieldValue in the output', async () => {
    const out = await executor.execute(
      cfg('score', '>', 50),
      { score: 80 },
      ctx
    )
    expect(out['field']).toBe('score')
    expect(out['fieldValue']).toBe(80)
  })

  it('returns "false" branch when the field is missing from inputData', async () => {
    const out = await executor.execute(cfg('missing', '==', 'x'), {}, ctx)
    expect(out[BRANCH_HANDLE_KEY]).toBe('false')
  })

  it('throws on an unknown operator', async () => {
    await expect(
      executor.execute(cfg('x', 'unknown-op', 1), { x: 1 }, ctx)
    ).rejects.toThrow('Invalid if-condition config')
  })

  it('throws on invalid config (missing operator)', async () => {
    await expect(
      executor.execute({ config: { field: 'x', value: 1 } }, {}, ctx)
    ).rejects.toThrow('Invalid if-condition config')
  })
})
