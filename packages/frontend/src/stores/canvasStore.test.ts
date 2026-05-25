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

vi.mock('@paralleldrive/cuid2', () => ({
  createId: () => 'generated-id',
}))

import { api } from '@/lib/api'

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

describe('setEdges', () => {
  it('replaces the edge list and marks dirty', () => {
    const edge = { id: 'e1', source: 'n1', target: 'n2' }
    useCanvasStore.getState().setEdges([edge] as never)
    expect(useCanvasStore.getState().edges).toHaveLength(1)
    expect(useCanvasStore.getState().isDirty).toBe(true)
  })
})

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
    let resolveGet!: (v: unknown) => void
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
