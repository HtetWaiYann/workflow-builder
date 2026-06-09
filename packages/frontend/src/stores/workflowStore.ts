import { create } from 'zustand'
import type { WorkflowSummary } from '@triggr/shared'

export interface WorkflowState {
  workflows: WorkflowSummary[]
  isLoading: boolean
  error: string | null
  setWorkflows: (workflows: WorkflowSummary[]) => void
  addWorkflow: (workflow: WorkflowSummary) => void
  updateWorkflow: (workflow: WorkflowSummary) => void
  removeWorkflow: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  workflows: [],
  isLoading: false,
  error: null,
  setWorkflows: (workflows) =>
    set({ workflows, isLoading: false, error: null }),
  addWorkflow: (workflow) =>
    set((s) => ({ workflows: [workflow, ...s.workflows] })),
  updateWorkflow: (workflow) =>
    set((s) => ({
      workflows: s.workflows.map((w) => (w.id === workflow.id ? workflow : w)),
    })),
  removeWorkflow: (id) =>
    set((s) => ({ workflows: s.workflows.filter((w) => w.id !== id) })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
}))
