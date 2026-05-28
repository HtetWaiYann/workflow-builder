import { describe, it, expect } from 'vitest'
import { SetFieldsExecutor } from './setFieldsExecutor'
import type { ExecutionContext } from '@workflow-builder/shared'

const ctx: ExecutionContext = {
  executionId: 'exec-1',
  workflowId: 'wf-1',
  nodeOutputs: {},
}

const executor = new SetFieldsExecutor()

// Merges a static set of key/value pairs onto the input object.
describe('SetFieldsExecutor', () => {
  it('has type "set-fields"', () => {
    expect(executor.type).toBe('set-fields')
  })

  it('adds new fields to inputData', async () => {
    const output = await executor.execute(
      { config: { fields: [{ key: 'status', value: 'active' }] } },
      { id: '1' },
      ctx
    )
    expect(output).toEqual({ id: '1', status: 'active' })
  })

  it('overwrites an existing field when the key matches', async () => {
    const output = await executor.execute(
      { config: { fields: [{ key: 'name', value: 'bob' }] } },
      { name: 'alice' },
      ctx
    )
    expect(output).toEqual({ name: 'bob' })
  })

  it('sets multiple fields in one pass', async () => {
    const output = await executor.execute(
      {
        config: {
          fields: [
            { key: 'a', value: 1 },
            { key: 'b', value: true },
            { key: 'c', value: null },
          ],
        },
      },
      {},
      ctx
    )
    expect(output).toEqual({ a: 1, b: true, c: null })
  })

  it('preserves existing fields that are not in the set-fields config', async () => {
    const output = await executor.execute(
      { config: { fields: [{ key: 'extra', value: 99 }] } },
      { keep: 'me', extra: 0 },
      ctx
    )
    expect(output).toEqual({ keep: 'me', extra: 99 })
  })

  it('returns inputData unchanged when fields array is empty', async () => {
    const input = { x: 1 }
    const output = await executor.execute(
      { config: { fields: [] } },
      input,
      ctx
    )
    expect(output).toEqual({ x: 1 })
  })

  it('supports nested object values', async () => {
    const output = await executor.execute(
      { config: { fields: [{ key: 'meta', value: { tag: 'v1' } }] } },
      {},
      ctx
    )
    expect(output).toEqual({ meta: { tag: 'v1' } })
  })

  it('throws on invalid config (missing fields array)', async () => {
    await expect(executor.execute({ config: {} }, {}, ctx)).rejects.toThrow(
      'Invalid set-fields config'
    )
  })

  it('throws when config is absent entirely', async () => {
    await expect(executor.execute({}, {}, ctx)).rejects.toThrow(
      'Invalid set-fields config'
    )
  })
})
