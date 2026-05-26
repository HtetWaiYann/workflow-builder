import { describe, it, expect } from 'vitest'
import { buildExecutionOrder, hasCycle } from './dag'
import type { WorkflowNode, WorkflowEdge } from '@workflow-builder/shared'

const node = (id: string): WorkflowNode => ({
  id,
  type: 'no-op',
  position: { x: 0, y: 0 },
  data: {},
})

const edge = (source: string, target: string): WorkflowEdge => ({
  id: `${source}->${target}`,
  source,
  target,
})

// Produces a topological sort of workflow nodes so the runner executes each node only after
// all its upstream dependencies have finished. Nodes in cycles are excluded from the result.
describe('buildExecutionOrder', () => {
  it('returns empty array for empty graph', () => {
    expect(buildExecutionOrder([], [])).toEqual([])
  })

  it('returns the single node for an isolated node', () => {
    expect(buildExecutionOrder([node('a')], [])).toEqual([node('a')])
  })

  it('returns source before target for a single edge', () => {
    const ids = buildExecutionOrder(
      [node('b'), node('a')],
      [edge('a', 'b')]
    ).map((n) => n.id)
    expect(ids).toEqual(['a', 'b'])
  })

  it('handles a linear chain a→b→c', () => {
    const ids = buildExecutionOrder(
      [node('a'), node('b'), node('c')],
      [edge('a', 'b'), edge('b', 'c')]
    ).map((n) => n.id)
    expect(ids).toEqual(['a', 'b', 'c'])
  })

  it('places the merge node last in a diamond graph', () => {
    const ids = buildExecutionOrder(
      [node('a'), node('b'), node('c'), node('d')],
      [edge('a', 'b'), edge('a', 'c'), edge('b', 'd'), edge('c', 'd')]
    ).map((n) => n.id)
    expect(ids[0]).toBe('a')
    expect(ids[ids.length - 1]).toBe('d')
    expect(ids).toContain('b')
    expect(ids).toContain('c')
  })

  it('returns fewer nodes than input when a cycle is present', () => {
    const result = buildExecutionOrder(
      [node('a'), node('b')],
      [edge('a', 'b'), edge('b', 'a')]
    )
    expect(result.length).toBeLessThan(2)
  })

  it('handles isolated nodes alongside a chain', () => {
    const ids = buildExecutionOrder(
      [node('x'), node('a'), node('b')],
      [edge('a', 'b')]
    ).map((n) => n.id)
    expect(ids).toContain('x')
    expect(ids.indexOf('a')).toBeLessThan(ids.indexOf('b'))
  })
})

// Detects directed cycles in the workflow graph using DFS. Used by the runner to abort
// execution early and mark the run as ERROR before any node is executed.
describe('hasCycle', () => {
  it('returns false for an empty graph', () => {
    expect(hasCycle([], [])).toBe(false)
  })

  it('returns false for an isolated node', () => {
    expect(hasCycle([node('a')], [])).toBe(false)
  })

  it('returns false for a linear chain', () => {
    expect(
      hasCycle(
        [node('a'), node('b'), node('c')],
        [edge('a', 'b'), edge('b', 'c')]
      )
    ).toBe(false)
  })

  it('returns false for a diamond graph', () => {
    expect(
      hasCycle(
        [node('a'), node('b'), node('c'), node('d')],
        [edge('a', 'b'), edge('a', 'c'), edge('b', 'd'), edge('c', 'd')]
      )
    ).toBe(false)
  })

  it('returns true for a simple two-node cycle', () => {
    expect(
      hasCycle([node('a'), node('b')], [edge('a', 'b'), edge('b', 'a')])
    ).toBe(true)
  })

  it('returns true for a self-loop', () => {
    expect(hasCycle([node('a')], [edge('a', 'a')])).toBe(true)
  })

  it('returns true for a cycle embedded in a larger graph', () => {
    expect(
      hasCycle(
        [node('a'), node('b'), node('c'), node('d')],
        [edge('a', 'b'), edge('b', 'c'), edge('c', 'd'), edge('d', 'b')]
      )
    ).toBe(true)
  })
})
