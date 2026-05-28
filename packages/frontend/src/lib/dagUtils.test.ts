import { describe, it, expect } from 'vitest'
import { hasCycle } from '@/lib/dagUtils'

const node = (id: string) => ({ id })
const edge = (source: string, target: string) => ({ source, target })

// Detects directed cycles in a workflow graph using Kahn's topological sort.
// Returns true if the graph cannot be fully sorted — i.e., a cycle is present.
describe('hasCycle', () => {
  it('returns false for an empty graph', () => {
    expect(hasCycle([], [])).toBe(false)
  })

  it('returns false for a single node with no edges', () => {
    expect(hasCycle([node('a')], [])).toBe(false)
  })

  it('returns false for a linear chain (a → b → c)', () => {
    expect(
      hasCycle(
        [node('a'), node('b'), node('c')],
        [edge('a', 'b'), edge('b', 'c')]
      )
    ).toBe(false)
  })

  it('returns false for a branching tree', () => {
    expect(
      hasCycle(
        [node('a'), node('b'), node('c')],
        [edge('a', 'b'), edge('a', 'c')]
      )
    ).toBe(false)
  })

  it('returns false for a diamond-shaped graph (a→b, a→c, b→d, c→d)', () => {
    expect(
      hasCycle(
        [node('a'), node('b'), node('c'), node('d')],
        [edge('a', 'b'), edge('a', 'c'), edge('b', 'd'), edge('c', 'd')]
      )
    ).toBe(false)
  })

  it('returns false for a disconnected graph with no cycles', () => {
    // Two independent chains
    expect(
      hasCycle(
        [node('a'), node('b'), node('c'), node('d')],
        [edge('a', 'b'), edge('c', 'd')]
      )
    ).toBe(false)
  })

  it('returns true for a direct two-node cycle (a → b → a)', () => {
    expect(
      hasCycle([node('a'), node('b')], [edge('a', 'b'), edge('b', 'a')])
    ).toBe(true)
  })

  it('returns true for a self-loop (a → a)', () => {
    expect(hasCycle([node('a')], [edge('a', 'a')])).toBe(true)
  })

  it('returns true for a longer cycle (a → b → c → a)', () => {
    expect(
      hasCycle(
        [node('a'), node('b'), node('c')],
        [edge('a', 'b'), edge('b', 'c'), edge('c', 'a')]
      )
    ).toBe(true)
  })

  it('returns true when only part of the graph forms a cycle', () => {
    // a → b → c → b (cycle between b and c; a has no cycle)
    expect(
      hasCycle(
        [node('a'), node('b'), node('c')],
        [edge('a', 'b'), edge('b', 'c'), edge('c', 'b')]
      )
    ).toBe(true)
  })
})
