import { describe, it, expect, beforeEach } from 'vitest'
import { useWorkflowStore } from '@/stores/workflowStore'
import type { WorkflowSummary } from '@workflow-builder/shared'

function makeWorkflow(id: string, name = 'Test Workflow'): WorkflowSummary {
  return {
    id,
    workspaceId: 'ws-1',
    name,
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  }
}

beforeEach(() => {
  useWorkflowStore.setState({ workflows: [], isLoading: false, error: null })
})

// Holds the fetched workflow list for the dashboard. Starts empty so the UI
// can show a loading state before the first fetch resolves.
describe('initial state', () => {
  it('starts with an empty list, not loading, no error', () => {
    const { workflows, isLoading, error } = useWorkflowStore.getState()
    expect(workflows).toEqual([])
    expect(isLoading).toBe(false)
    expect(error).toBeNull()
  })
})

describe('setWorkflows', () => {
  it('replaces the list and clears loading and error', () => {
    useWorkflowStore.setState({ isLoading: true, error: 'old error' })
    useWorkflowStore
      .getState()
      .setWorkflows([makeWorkflow('1'), makeWorkflow('2')])
    const { workflows, isLoading, error } = useWorkflowStore.getState()
    expect(workflows).toHaveLength(2)
    expect(isLoading).toBe(false)
    expect(error).toBeNull()
  })
})

describe('addWorkflow', () => {
  it('prepends the new workflow so it appears first', () => {
    useWorkflowStore.getState().setWorkflows([makeWorkflow('1')])
    useWorkflowStore.getState().addWorkflow(makeWorkflow('2', 'New'))
    const { workflows } = useWorkflowStore.getState()
    expect(workflows[0].id).toBe('2')
    expect(workflows).toHaveLength(2)
  })
})

describe('updateWorkflow', () => {
  it('replaces the matching workflow by id', () => {
    useWorkflowStore.getState().setWorkflows([makeWorkflow('1', 'Old Name')])
    useWorkflowStore.getState().updateWorkflow(makeWorkflow('1', 'New Name'))
    expect(useWorkflowStore.getState().workflows[0].name).toBe('New Name')
  })

  it('leaves other workflows untouched', () => {
    useWorkflowStore
      .getState()
      .setWorkflows([makeWorkflow('1'), makeWorkflow('2', 'Keep Me')])
    useWorkflowStore.getState().updateWorkflow(makeWorkflow('1', 'Changed'))
    expect(useWorkflowStore.getState().workflows[1].name).toBe('Keep Me')
  })
})

describe('removeWorkflow', () => {
  it('removes the workflow with the given id', () => {
    useWorkflowStore
      .getState()
      .setWorkflows([makeWorkflow('1'), makeWorkflow('2')])
    useWorkflowStore.getState().removeWorkflow('1')
    const { workflows } = useWorkflowStore.getState()
    expect(workflows).toHaveLength(1)
    expect(workflows[0].id).toBe('2')
  })

  it('is a no-op when the id does not exist', () => {
    useWorkflowStore.getState().setWorkflows([makeWorkflow('1')])
    useWorkflowStore.getState().removeWorkflow('not-found')
    expect(useWorkflowStore.getState().workflows).toHaveLength(1)
  })
})

describe('setLoading', () => {
  it('sets isLoading', () => {
    useWorkflowStore.getState().setLoading(true)
    expect(useWorkflowStore.getState().isLoading).toBe(true)
    useWorkflowStore.getState().setLoading(false)
    expect(useWorkflowStore.getState().isLoading).toBe(false)
  })
})

describe('setError', () => {
  it('stores the error message and clears isLoading', () => {
    useWorkflowStore.setState({ isLoading: true })
    useWorkflowStore.getState().setError('something went wrong')
    expect(useWorkflowStore.getState().error).toBe('something went wrong')
    expect(useWorkflowStore.getState().isLoading).toBe(false)
  })

  it('clears a previous error when set to null', () => {
    useWorkflowStore.setState({ error: 'old error' })
    useWorkflowStore.getState().setError(null)
    expect(useWorkflowStore.getState().error).toBeNull()
  })
})
