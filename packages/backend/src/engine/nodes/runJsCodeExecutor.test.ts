import { describe, it, expect } from 'vitest'
import { RunJsCodeExecutor } from './runJsCodeExecutor'
import type { ExecutionContext } from '@triggr/shared'

const ctx: ExecutionContext = {
  executionId: 'exec-1',
  workflowId: 'wf-1',
  nodeOutputs: {},
}

const executor = new RunJsCodeExecutor()

// Runs user-supplied JS inside a Node vm sandbox. The code must return a plain
// object; non-objects, arrays, and null all cause an error.
describe('RunJsCodeExecutor', () => {
  it('has type "run-js-code"', () => {
    expect(executor.type).toBe('run-js-code')
  })

  it('executes code and returns the plain object result', async () => {
    const out = await executor.execute(
      { config: { code: 'return { doubled: $input.n * 2 }' } },
      { n: 21 },
      ctx
    )
    expect(out).toEqual({ doubled: 42 })
  })

  it('exposes $input so code can reference upstream data', async () => {
    const out = await executor.execute(
      { config: { code: 'return { name: $input.name.toUpperCase() }' } },
      { name: 'alice' },
      ctx
    )
    expect(out).toEqual({ name: 'ALICE' })
  })

  it('returns an object with multiple computed fields', async () => {
    const out = await executor.execute(
      { config: { code: 'return { a: 1, b: 2, sum: 3 }' } },
      {},
      ctx
    )
    expect(out).toEqual({ a: 1, b: 2, sum: 3 })
  })

  it('throws when code returns a primitive (number)', async () => {
    await expect(
      executor.execute({ config: { code: 'return 42' } }, {}, ctx)
    ).rejects.toThrow('Code must return a plain object')
  })

  it('throws when code returns a string', async () => {
    await expect(
      executor.execute({ config: { code: 'return "hello"' } }, {}, ctx)
    ).rejects.toThrow('Code must return a plain object')
  })

  it('throws when code returns null', async () => {
    await expect(
      executor.execute({ config: { code: 'return null' } }, {}, ctx)
    ).rejects.toThrow('Code must return a plain object')
  })

  it('throws when code returns an array', async () => {
    await expect(
      executor.execute({ config: { code: 'return [1, 2, 3]' } }, {}, ctx)
    ).rejects.toThrow('Code must return a plain object')
  })

  it('wraps a syntax error in a "Code execution failed" message', async () => {
    await expect(
      executor.execute(
        { config: { code: 'this is not valid js ;;;' } },
        {},
        ctx
      )
    ).rejects.toThrow('Code execution failed')
  })

  it('wraps a runtime error in a "Code execution failed" message', async () => {
    await expect(
      executor.execute(
        { config: { code: 'throw new Error("intentional")' } },
        {},
        ctx
      )
    ).rejects.toThrow('Code execution failed')
  })

  it('throws on invalid config (missing code field)', async () => {
    await expect(executor.execute({ config: {} }, {}, ctx)).rejects.toThrow(
      'Invalid run-js-code config'
    )
  })
})
