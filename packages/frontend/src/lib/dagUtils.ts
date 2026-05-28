/**
 * Returns true if the directed graph described by nodes and edges contains a cycle.
 * Uses Kahn's algorithm (topological sort via in-degree reduction).
 * Accepts any objects that have the required id/source/target fields so it works
 * for both React Flow Node/Edge and WorkflowNode/WorkflowEdge.
 */
export function hasCycle(
  nodes: { id: string }[],
  edges: { source: string; target: string }[]
): boolean {
  const inDegree = new Map(nodes.map((n) => [n.id, 0]))
  for (const edge of edges) {
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1)
  }

  const queue: string[] = []
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id)
  }

  let visited = 0
  while (queue.length > 0) {
    const id = queue.shift()!
    visited++
    for (const edge of edges) {
      if (edge.source === id) {
        const newDegree = (inDegree.get(edge.target) ?? 1) - 1
        inDegree.set(edge.target, newDegree)
        if (newDegree === 0) queue.push(edge.target)
      }
    }
  }

  return visited < nodes.length
}
