import type { WorkflowNode, WorkflowEdge } from '@workflow-builder/shared'

/**
 * Returns nodes sorted in topological execution order (sources first) using Kahn's algorithm.
 * @param nodes - All nodes in the workflow graph.
 * @param edges - All edges in the workflow graph.
 * @returns Nodes sorted so each node appears after all its upstream dependencies.
 * @throws If the graph contains a cycle (use hasCycle to pre-check if needed).
 */
export function buildExecutionOrder(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): WorkflowNode[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const inDegree = new Map(nodes.map((n) => [n.id, 0]))

  for (const edge of edges) {
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1)
  }

  const queue: string[] = []
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id)
  }

  const sorted: WorkflowNode[] = []
  while (queue.length > 0) {
    const id = queue.shift()!
    const node = nodeMap.get(id)
    if (node) sorted.push(node)

    for (const edge of edges) {
      if (edge.source === id) {
        const newDegree = (inDegree.get(edge.target) ?? 1) - 1
        inDegree.set(edge.target, newDegree)
        if (newDegree === 0) queue.push(edge.target)
      }
    }
  }

  return sorted
}

/** Returns true if the directed graph contains a cycle. */
export function hasCycle(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): boolean {
  return buildExecutionOrder(nodes, edges).length < nodes.length
}
