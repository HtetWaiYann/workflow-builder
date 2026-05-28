import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useCanvasStore } from '@/stores/canvasStore'

vi.mock('@/lib/api', () => ({
  api: {
    workflows: {
      get: vi.fn(),
      saveCanvas: vi.fn(),
      updateWorkflowName: vi.fn(),
      activate: vi.fn(),
      deactivate: vi.fn(),
    },
  },
}))

vi.mock('sonner', () => ({
  toast: { warning: vi.fn(), error: vi.fn() },
}))

vi.mock('@paralleldrive/cuid2', () => ({
  createId: () => 'generated-id',
}))

import { api } from '@/lib/api'
import { toast } from 'sonner'

const mockGet = vi.mocked(api.workflows.get)
const mockSaveCanvas = vi.mocked(api.workflows.saveCanvas)
const mockUpdateName = vi.mocked(api.workflows.updateWorkflowName)
const mockActivate = vi.mocked(api.workflows.activate)
const mockDeactivate = vi.mocked(api.workflows.deactivate)

const fakeWorkflow = {
  id: 'wf-1',
  workspaceId: 'ws-1',
  name: 'My Workflow',
  status: 'DRAFT' as const,
  nodes: [],
  edges: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  useCanvasStore.getState().reset()
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
})

// Verifies the store boots in a fully idle state with no workflow loaded, no selection,
// and all async flags set to their off values.
describe('initial state', () => {
  it('starts empty and idle', () => {
    const s = useCanvasStore.getState()
    expect(s.workflowId).toBeNull()
    expect(s.workflowName).toBe('')
    expect(s.workflowStatus).toBe('DRAFT')
    expect(s.nodes).toEqual([])
    expect(s.edges).toEqual([])
    expect(s.selectedNodeId).toBeNull()
    expect(s.isDirty).toBe(false)
    expect(s.isSaving).toBe(false)
    expect(s.isLoading).toBe(false)
    expect(s.error).toBeNull()
  })
})

// Wipes all canvas state back to initial values. Called when navigating away from the
// editor so stale workflow data never leaks into the next session.
describe('reset', () => {
  it('clears all state back to initial values', () => {
    useCanvasStore.setState({
      workflowId: 'wf-1',
      workflowName: 'Test',
      isDirty: true,
      selectedNodeId: 'n1',
      error: 'some error',
    })
    useCanvasStore.getState().reset()
    const s = useCanvasStore.getState()
    expect(s.workflowId).toBeNull()
    expect(s.workflowName).toBe('')
    expect(s.isDirty).toBe(false)
    expect(s.selectedNodeId).toBeNull()
    expect(s.error).toBeNull()
  })
})

// Replaces the node list and marks the canvas dirty so the auto-save timer fires.
describe('setNodes', () => {
  it('replaces the node list and marks dirty', () => {
    const node = {
      id: 'n1',
      type: 'manual-trigger',
      position: { x: 0, y: 0 },
      data: {},
    }
    useCanvasStore.getState().setNodes([node] as never)
    const s = useCanvasStore.getState()
    expect(s.nodes).toHaveLength(1)
    expect(s.nodes[0].id).toBe('n1')
    expect(s.isDirty).toBe(true)
  })
})

// Replaces the edge list and marks the canvas dirty so the auto-save timer fires.
describe('setEdges', () => {
  it('replaces the edge list and marks dirty', () => {
    const edge = { id: 'e1', source: 'n1', target: 'n2' }
    useCanvasStore.getState().setEdges([edge] as never)
    expect(useCanvasStore.getState().edges).toHaveLength(1)
    expect(useCanvasStore.getState().isDirty).toBe(true)
  })
})

// Appends a new node at the given canvas position with a generated id, the correct node
// type, and the default label from the node registry.
describe('addNode', () => {
  it('appends a new node with the correct type, label, and position', () => {
    useCanvasStore.getState().addNode('manual-trigger', { x: 100, y: 200 })
    const { nodes } = useCanvasStore.getState()
    expect(nodes).toHaveLength(1)
    expect(nodes[0].id).toBe('generated-id')
    expect(nodes[0].type).toBe('manual-trigger')
    expect(nodes[0].position).toEqual({ x: 100, y: 200 })
    expect(nodes[0].data.label).toBe('Manual Trigger')
  })

  it('marks the canvas dirty', () => {
    useCanvasStore.getState().addNode('delay', { x: 0, y: 0 })
    expect(useCanvasStore.getState().isDirty).toBe(true)
  })
})

// Sets or clears the selected node id, which drives the ConfigPanel's open/close state.
describe('selectNode', () => {
  it('sets the selected node id', () => {
    useCanvasStore.getState().selectNode('n1')
    expect(useCanvasStore.getState().selectedNodeId).toBe('n1')
  })

  it('clears selection when called with null', () => {
    useCanvasStore.getState().selectNode('n1')
    useCanvasStore.getState().selectNode(null)
    expect(useCanvasStore.getState().selectedNodeId).toBeNull()
  })
})

// Updates the display label of a specific node by id and marks the canvas dirty.
// Is a no-op when the node id is not found.
describe('updateNodeLabel', () => {
  it('updates the label of the matching node', () => {
    useCanvasStore.setState({
      nodes: [
        {
          id: 'n1',
          type: 'delay',
          position: { x: 0, y: 0 },
          data: { label: 'Old' },
        },
      ] as never,
    })
    useCanvasStore.getState().updateNodeLabel('n1', 'New Label')
    expect(useCanvasStore.getState().nodes[0].data.label).toBe('New Label')
  })

  it('marks dirty', () => {
    useCanvasStore.setState({
      nodes: [
        {
          id: 'n1',
          type: 'delay',
          position: { x: 0, y: 0 },
          data: { label: 'Old' },
        },
      ] as never,
    })
    useCanvasStore.getState().updateNodeLabel('n1', 'New')
    expect(useCanvasStore.getState().isDirty).toBe(true)
  })

  it('is a no-op for an unknown node id', () => {
    useCanvasStore.setState({
      nodes: [
        {
          id: 'n1',
          type: 'delay',
          position: { x: 0, y: 0 },
          data: { label: 'Old' },
        },
      ] as never,
    })
    useCanvasStore.getState().updateNodeLabel('missing', 'New')
    expect(useCanvasStore.getState().nodes[0].data.label).toBe('Old')
  })
})

// Merges a partial config object into the node's data.config and marks the canvas dirty.
describe('updateNodeConfig', () => {
  it('updates the config of the matching node and marks dirty', () => {
    useCanvasStore.setState({
      nodes: [
        {
          id: 'n1',
          type: 'delay',
          position: { x: 0, y: 0 },
          data: { label: 'Delay', config: {} },
        },
      ] as never,
    })
    useCanvasStore.getState().updateNodeConfig('n1', { seconds: 30 })
    expect(useCanvasStore.getState().nodes[0].data.config).toEqual({
      seconds: 30,
    })
    expect(useCanvasStore.getState().isDirty).toBe(true)
  })
})

// Fetches a workflow from the API and hydrates the canvas store. Sets isLoading during the
// request and clears it on completion. Maps NOT_FOUND errors to a specific error code.
describe('loadWorkflow', () => {
  it('populates state from the API response and clears loading', async () => {
    mockGet.mockResolvedValue({
      workflow: { ...fakeWorkflow, name: 'Loaded', nodes: [], edges: [] },
    } as never)
    await useCanvasStore.getState().loadWorkflow('wf-1')
    const s = useCanvasStore.getState()
    expect(s.workflowId).toBe('wf-1')
    expect(s.workflowName).toBe('Loaded')
    expect(s.workflowStatus).toBe('DRAFT')
    expect(s.isLoading).toBe(false)
    expect(s.isDirty).toBe(false)
    expect(s.error).toBeNull()
  })

  it('sets isLoading=true during the request', async () => {
    let resolveGet!: (v: { workflow: typeof fakeWorkflow }) => void
    mockGet.mockReturnValue(
      new Promise((r) => {
        resolveGet = r
      })
    )
    const promise = useCanvasStore.getState().loadWorkflow('wf-1')
    expect(useCanvasStore.getState().isLoading).toBe(true)
    resolveGet({ workflow: fakeWorkflow })
    await promise
  })

  it('sets error to WORKFLOW_NOT_FOUND on 404', async () => {
    const err = Object.assign(new Error('Not found'), { code: 'NOT_FOUND' })
    mockGet.mockRejectedValue(err)
    await useCanvasStore.getState().loadWorkflow('wf-1')
    expect(useCanvasStore.getState().error).toBe('WORKFLOW_NOT_FOUND')
    expect(useCanvasStore.getState().isLoading).toBe(false)
  })

  it('stores the error message on other failures', async () => {
    mockGet.mockRejectedValue(new Error('Network error'))
    await useCanvasStore.getState().loadWorkflow('wf-1')
    expect(useCanvasStore.getState().error).toBe('Network error')
  })
})

// Persists the current nodes and edges to the backend. Clears isDirty on success and
// isSaving on both success and failure. Is a no-op when no workflow is loaded.
describe('saveCanvas', () => {
  it('is a no-op when workflowId is not set', async () => {
    await useCanvasStore.getState().saveCanvas()
    expect(mockSaveCanvas).not.toHaveBeenCalled()
  })

  it('calls the API and clears isDirty on success', async () => {
    mockSaveCanvas.mockResolvedValue({ workflow: fakeWorkflow } as never)
    useCanvasStore.setState({ workflowId: 'wf-1', isDirty: true })
    await useCanvasStore.getState().saveCanvas()
    expect(mockSaveCanvas).toHaveBeenCalledWith('wf-1', [], [])
    const s = useCanvasStore.getState()
    expect(s.isDirty).toBe(false)
    expect(s.isSaving).toBe(false)
  })

  it('clears isSaving on API failure without rethrowing', async () => {
    mockSaveCanvas.mockRejectedValue(new Error('Save failed'))
    useCanvasStore.setState({ workflowId: 'wf-1' })
    await expect(
      useCanvasStore.getState().saveCanvas()
    ).resolves.toBeUndefined()
    expect(useCanvasStore.getState().isSaving).toBe(false)
  })
})

// Optimistically updates the workflow name in the store before the API call resolves.
// On failure the optimistic name stays in place rather than reverting.
describe('updateWorkflowName', () => {
  it('is a no-op when workflowId is not set', async () => {
    await useCanvasStore.getState().updateWorkflowName('New')
    expect(mockUpdateName).not.toHaveBeenCalled()
  })

  it('optimistically updates the name before the API resolves', async () => {
    mockUpdateName.mockResolvedValue({
      data: { id: 'wf-1', name: 'New' },
    } as never)
    useCanvasStore.setState({ workflowId: 'wf-1', workflowName: 'Old' })
    const promise = useCanvasStore.getState().updateWorkflowName('New')
    expect(useCanvasStore.getState().workflowName).toBe('New')
    await promise
  })

  it('leaves the optimistic name in place on API failure', async () => {
    mockUpdateName.mockRejectedValue(new Error('API error'))
    useCanvasStore.setState({ workflowId: 'wf-1', workflowName: 'Old' })
    await useCanvasStore.getState().updateWorkflowName('New')
    expect(useCanvasStore.getState().workflowName).toBe('New')
  })
})

// Toggles between ACTIVE and INACTIVE (or DRAFT → ACTIVE). Calls the appropriate
// activate/deactivate API endpoint and reflects the new status from the response.
describe('toggleWorkflowStatus', () => {
  it('deactivates an ACTIVE workflow', async () => {
    mockDeactivate.mockResolvedValue({
      workflow: { ...fakeWorkflow, status: 'INACTIVE' },
    } as never)
    useCanvasStore.setState({ workflowId: 'wf-1', workflowStatus: 'ACTIVE' })
    await useCanvasStore.getState().toggleWorkflowStatus()
    expect(mockDeactivate).toHaveBeenCalledWith('wf-1')
    expect(useCanvasStore.getState().workflowStatus).toBe('INACTIVE')
  })

  it('activates an INACTIVE workflow', async () => {
    mockActivate.mockResolvedValue({
      workflow: { ...fakeWorkflow, status: 'ACTIVE' },
    } as never)
    useCanvasStore.setState({ workflowId: 'wf-1', workflowStatus: 'INACTIVE' })
    await useCanvasStore.getState().toggleWorkflowStatus()
    expect(mockActivate).toHaveBeenCalledWith('wf-1')
    expect(useCanvasStore.getState().workflowStatus).toBe('ACTIVE')
  })

  it('activates a DRAFT workflow', async () => {
    mockActivate.mockResolvedValue({
      workflow: { ...fakeWorkflow, status: 'ACTIVE' },
    } as never)
    useCanvasStore.setState({ workflowId: 'wf-1', workflowStatus: 'DRAFT' })
    await useCanvasStore.getState().toggleWorkflowStatus()
    expect(mockActivate).toHaveBeenCalled()
    expect(useCanvasStore.getState().workflowStatus).toBe('ACTIVE')
  })
})

// Sets isDirty immediately and schedules a debounced auto-save after 2 seconds. Multiple
// rapid calls collapse into a single save, preventing redundant API requests.
describe('markDirty', () => {
  it('sets isDirty=true immediately', () => {
    useCanvasStore.getState().markDirty()
    expect(useCanvasStore.getState().isDirty).toBe(true)
  })

  it('triggers auto-save after 2 s', async () => {
    mockSaveCanvas.mockResolvedValue({ workflow: fakeWorkflow } as never)
    useCanvasStore.setState({ workflowId: 'wf-1' })
    useCanvasStore.getState().markDirty()
    await vi.advanceTimersByTimeAsync(2000)
    expect(mockSaveCanvas).toHaveBeenCalled()
  })

  it('debounces: only one save fires if markDirty is called repeatedly', async () => {
    mockSaveCanvas.mockResolvedValue({ workflow: fakeWorkflow } as never)
    useCanvasStore.setState({ workflowId: 'wf-1' })
    useCanvasStore.getState().markDirty()
    useCanvasStore.getState().markDirty()
    useCanvasStore.getState().markDirty()
    await vi.advanceTimersByTimeAsync(2000)
    expect(mockSaveCanvas).toHaveBeenCalledTimes(1)
  })
})

// Saves a snapshot of nodes + edges onto a module-level undo stack before each
// destructive canvas change. canUndo and canRedo are reactive flags for toolbar buttons.
describe('pushHistory / undo / redo', () => {
  const nodeA = {
    id: 'a',
    type: 'manual-trigger',
    position: { x: 0, y: 0 },
    data: {},
  }
  const nodeB = {
    id: 'b',
    type: 'set-fields',
    position: { x: 100, y: 0 },
    data: {},
  }

  it('pushHistory sets canUndo=true and canRedo=false', () => {
    useCanvasStore.getState().pushHistory()
    const s = useCanvasStore.getState()
    expect(s.canUndo).toBe(true)
    expect(s.canRedo).toBe(false)
  })

  it('undo restores the previous nodes and edges', () => {
    useCanvasStore.setState({ nodes: [nodeA] as never, edges: [] })
    useCanvasStore.getState().pushHistory()
    useCanvasStore.setState({ nodes: [nodeA, nodeB] as never, edges: [] })

    useCanvasStore.getState().undo()

    expect(useCanvasStore.getState().nodes).toHaveLength(1)
    expect(useCanvasStore.getState().nodes[0].id).toBe('a')
  })

  it('undo sets canRedo=true so the action can be re-applied', () => {
    useCanvasStore.getState().pushHistory()
    useCanvasStore.getState().undo()
    expect(useCanvasStore.getState().canRedo).toBe(true)
  })

  it('undo sets canUndo=false when the stack is exhausted', () => {
    useCanvasStore.getState().pushHistory()
    useCanvasStore.getState().undo()
    expect(useCanvasStore.getState().canUndo).toBe(false)
  })

  it('undo is a no-op when there is nothing to undo', () => {
    useCanvasStore.setState({ nodes: [nodeA] as never })
    useCanvasStore.getState().undo()
    expect(useCanvasStore.getState().nodes).toHaveLength(1)
    expect(useCanvasStore.getState().canUndo).toBe(false)
  })

  it('undo marks the canvas dirty', () => {
    useCanvasStore.getState().pushHistory()
    useCanvasStore.setState({ isDirty: false })
    useCanvasStore.getState().undo()
    expect(useCanvasStore.getState().isDirty).toBe(true)
  })

  it('redo re-applies the undone nodes and edges', () => {
    useCanvasStore.setState({ nodes: [nodeA] as never, edges: [] })
    useCanvasStore.getState().pushHistory()
    useCanvasStore.setState({ nodes: [nodeA, nodeB] as never, edges: [] })

    useCanvasStore.getState().undo()
    expect(useCanvasStore.getState().nodes).toHaveLength(1)

    useCanvasStore.getState().redo()
    expect(useCanvasStore.getState().nodes).toHaveLength(2)
  })

  it('redo sets canRedo=false when the future stack is exhausted', () => {
    useCanvasStore.getState().pushHistory()
    useCanvasStore.getState().undo()
    useCanvasStore.getState().redo()
    expect(useCanvasStore.getState().canRedo).toBe(false)
  })

  it('redo is a no-op when there is nothing to redo', () => {
    useCanvasStore.setState({ nodes: [nodeA] as never })
    useCanvasStore.getState().redo()
    expect(useCanvasStore.getState().nodes).toHaveLength(1)
    expect(useCanvasStore.getState().canRedo).toBe(false)
  })

  it('redo marks the canvas dirty', () => {
    useCanvasStore.getState().pushHistory()
    useCanvasStore.getState().undo()
    useCanvasStore.setState({ isDirty: false })
    useCanvasStore.getState().redo()
    expect(useCanvasStore.getState().isDirty).toBe(true)
  })

  it('pushHistory clears the redo stack', () => {
    useCanvasStore.getState().pushHistory()
    useCanvasStore.getState().undo()
    expect(useCanvasStore.getState().canRedo).toBe(true)

    useCanvasStore.getState().pushHistory()
    expect(useCanvasStore.getState().canRedo).toBe(false)
  })

  it('addNode pushes history so the addition is undoable', () => {
    useCanvasStore.getState().addNode('manual-trigger', { x: 0, y: 0 })
    expect(useCanvasStore.getState().canUndo).toBe(true)

    useCanvasStore.getState().undo()
    expect(useCanvasStore.getState().nodes).toHaveLength(0)
  })

  it('reset clears history and resets canUndo and canRedo to false', () => {
    useCanvasStore.getState().pushHistory()
    useCanvasStore.getState().reset()
    const s = useCanvasStore.getState()
    expect(s.canUndo).toBe(false)
    expect(s.canRedo).toBe(false)
  })
})

// When an ACTIVE workflow is saved and the graph contains a cycle, a warning toast is
// shown so the user knows the scheduled/webhook run will fail immediately.
describe('saveCanvas — cycle warning for active workflows', () => {
  it('shows a toast.warning after saving an ACTIVE workflow that has a cycle', async () => {
    mockSaveCanvas.mockResolvedValue({ workflow: fakeWorkflow } as never)
    useCanvasStore.setState({
      workflowId: 'wf-1',
      workflowStatus: 'ACTIVE',
      nodes: [
        { id: 'a', type: 'manual-trigger', position: { x: 0, y: 0 }, data: {} },
        { id: 'b', type: 'set-fields', position: { x: 100, y: 0 }, data: {} },
      ] as never,
      edges: [
        { id: 'e1', source: 'a', target: 'b' },
        { id: 'e2', source: 'b', target: 'a' },
      ] as never,
    })

    await useCanvasStore.getState().saveCanvas()

    expect(vi.mocked(toast.warning)).toHaveBeenCalledWith(
      'Active workflow has a cycle',
      expect.objectContaining({ id: 'cycle-warning' })
    )
  })

  it('does not show a toast when saving a DRAFT workflow with a cycle', async () => {
    mockSaveCanvas.mockResolvedValue({ workflow: fakeWorkflow } as never)
    useCanvasStore.setState({
      workflowId: 'wf-1',
      workflowStatus: 'DRAFT',
      nodes: [
        { id: 'a', type: 'manual-trigger', position: { x: 0, y: 0 }, data: {} },
        { id: 'b', type: 'set-fields', position: { x: 100, y: 0 }, data: {} },
      ] as never,
      edges: [
        { id: 'e1', source: 'a', target: 'b' },
        { id: 'e2', source: 'b', target: 'a' },
      ] as never,
    })

    await useCanvasStore.getState().saveCanvas()

    expect(vi.mocked(toast.warning)).not.toHaveBeenCalled()
  })

  it('does not show a toast when saving an ACTIVE workflow without a cycle', async () => {
    mockSaveCanvas.mockResolvedValue({ workflow: fakeWorkflow } as never)
    useCanvasStore.setState({
      workflowId: 'wf-1',
      workflowStatus: 'ACTIVE',
      nodes: [
        { id: 'a', type: 'manual-trigger', position: { x: 0, y: 0 }, data: {} },
        { id: 'b', type: 'set-fields', position: { x: 100, y: 0 }, data: {} },
      ] as never,
      edges: [{ id: 'e1', source: 'a', target: 'b' }] as never,
    })

    await useCanvasStore.getState().saveCanvas()

    expect(vi.mocked(toast.warning)).not.toHaveBeenCalled()
  })
})
