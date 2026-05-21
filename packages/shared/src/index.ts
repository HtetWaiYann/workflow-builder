export const GREETING = 'Hello from @workflow-builder/shared!'

export interface WorkflowNode {
  id: string
  type: string
  label: string
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
}
