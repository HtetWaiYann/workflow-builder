import { describe, it, expect } from 'vitest'
import { RenameKeysExecutor } from './renameKeysExecutor'
import type { ExecutionContext } from '@workflow-builder/shared'

const ctx: ExecutionContext = {
  executionId: 'exec-1',
  workflowId: 'wf-1',
  nodeOutputs: {},
}

const executor = new RenameKeysExecutor()

// Renames keys in the input object according to a from→to mapping list.
// Keys that are absent in the input are silently skipped.
describe('RenameKeysExecutor', () => {
  it('has type "rename-keys"', () => {
    expect(executor.type).toBe('rename-keys')
  })

  it('renames a single key', async () => {
    const output = await executor.execute(
      { config: { mappings: [{ from: 'name', to: 'fullName' }] } },
      { name: 'alice' },
      ctx
    )
    expect(output).toEqual({ fullName: 'alice' })
  })

  it('renames multiple keys in one pass', async () => {
    const output = await executor.execute(
      {
        config: {
          mappings: [
            { from: 'a', to: 'x' },
            { from: 'b', to: 'y' },
          ],
        },
      },
      { a: 1, b: 2 },
      ctx
    )
    expect(output).toEqual({ x: 1, y: 2 })
  })

  it('removes the old key after renaming', async () => {
    const output = await executor.execute(
      { config: { mappings: [{ from: 'old', to: 'new' }] } },
      { old: 'value' },
      ctx
    )
    expect('old' in output).toBe(false)
    expect(output['new']).toBe('value')
  })

  it('silently skips a mapping when the source key does not exist', async () => {
    const output = await executor.execute(
      { config: { mappings: [{ from: 'missing', to: 'target' }] } },
      { other: 42 },
      ctx
    )
    expect(output).toEqual({ other: 42 })
    expect('target' in output).toBe(false)
  })

  it('preserves unrelated keys', async () => {
    const output = await executor.execute(
      { config: { mappings: [{ from: 'a', to: 'z' }] } },
      { a: 1, b: 2, c: 3 },
      ctx
    )
    expect(output).toMatchObject({ b: 2, c: 3, z: 1 })
  })

  it('returns inputData unchanged when mappings array is empty', async () => {
    const input = { x: 1 }
    const output = await executor.execute(
      { config: { mappings: [] } },
      input,
      ctx
    )
    expect(output).toEqual({ x: 1 })
  })

  it('throws on invalid config (missing mappings)', async () => {
    await expect(executor.execute({ config: {} }, {}, ctx)).rejects.toThrow(
      'Invalid rename-keys config'
    )
  })
})
