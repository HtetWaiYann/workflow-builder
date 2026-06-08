import { describe, it, expect, vi } from 'vitest'
import { FilterArrayExecutor } from './filterArrayExecutor'
import type { ExecutionContext } from '@triggr/shared'

vi.mock('../../lib/logger', () => ({
  logger: { warn: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() },
}))

const ctx: ExecutionContext = {
  executionId: 'exec-1',
  workflowId: 'wf-1',
  nodeOutputs: {},
}

const executor = new FilterArrayExecutor()

// Filters the items/data array from inputData using a sandboxed JS expression.
// Items that throw or return falsy are excluded. Falls back to [] when no array is found.
describe('FilterArrayExecutor', () => {
  it('has type "filter-array"', () => {
    expect(executor.type).toBe('filter-array')
  })

  it('filters items using a simple expression', async () => {
    const out = await executor.execute(
      { config: { expression: 'item.active === true' } },
      { items: [{ active: true }, { active: false }, { active: true }] },
      ctx
    )
    expect(out['items']).toHaveLength(2)
    expect((out['items'] as { active: boolean }[]).every((i) => i.active)).toBe(
      true
    )
  })

  it('reads items from the "data" key when "items" is absent', async () => {
    const out = await executor.execute(
      { config: { expression: 'item > 2' } },
      { data: [1, 2, 3, 4] },
      ctx
    )
    expect(out['items']).toEqual([3, 4])
  })

  it('falls back to an empty array when neither items nor data exists', async () => {
    const out = await executor.execute(
      { config: { expression: 'true' } },
      { other: 'field' },
      ctx
    )
    expect(out['items']).toEqual([])
  })

  it('returns all items when the expression always evaluates to true', async () => {
    const out = await executor.execute(
      { config: { expression: 'true' } },
      { items: [1, 2, 3] },
      ctx
    )
    expect(out['items']).toEqual([1, 2, 3])
  })

  it('returns no items when the expression always evaluates to false', async () => {
    const out = await executor.execute(
      { config: { expression: 'false' } },
      { items: [1, 2, 3] },
      ctx
    )
    expect(out['items']).toEqual([])
  })

  it('excludes items where the expression throws and continues filtering others', async () => {
    const out = await executor.execute(
      { config: { expression: 'item.x > 0' } },
      { items: [{ x: 1 }, null, { x: 3 }] },
      ctx
    )
    // null causes a throw in the sandbox — it should be excluded
    expect(out['items']).toHaveLength(2)
  })

  it('spreads non-items fields into the output', async () => {
    const out = await executor.execute(
      { config: { expression: 'item > 1' } },
      { items: [1, 2], meta: 'kept' },
      ctx
    )
    expect(out['meta']).toBe('kept')
  })

  it('throws on invalid config (missing expression)', async () => {
    await expect(executor.execute({ config: {} }, {}, ctx)).rejects.toThrow(
      'Invalid filter-array config'
    )
  })
})
