import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { useCanvasStore } from '@/stores/canvasStore'
import { useExecutionStore } from '@/stores/executionStore'
import { CanvasToolbar } from '@/components/canvas/CanvasToolbar'

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), warning: vi.fn() },
}))

const mockNavigate = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('@/lib/api', () => ({
  api: {
    workflows: {
      saveCanvas: vi.fn(),
      updateWorkflowName: vi.fn(),
      activate: vi.fn(),
      deactivate: vi.fn(),
    },
  },
}))

import { api } from '@/lib/api'
import { toast } from 'sonner'

function renderToolbar() {
  return render(
    <MemoryRouter>
      <CanvasToolbar />
    </MemoryRouter>
  )
}

const mockTriggerExecution = vi.fn().mockResolvedValue(undefined)

beforeEach(() => {
  vi.clearAllMocks()
  useCanvasStore.getState().reset()
  useExecutionStore.setState({
    triggerExecution: mockTriggerExecution,
  } as never)
  useCanvasStore.setState({
    workflowId: 'wf-1',
    workflowName: 'My Workflow',
    workflowStatus: 'DRAFT',
    isDirty: false,
    isSaving: false,
  })
})

// Top bar of the workflow canvas. Displays the workflow name with inline editing, a Save
// button gated on unsaved changes, a dirty-state indicator, and navigation back to the list.
describe('CanvasToolbar', () => {
  it('renders the workflow name', () => {
    renderToolbar()
    expect(screen.getByText('My Workflow')).toBeInTheDocument()
  })

  it('clicking the name switches to an editable input', async () => {
    renderToolbar()
    await userEvent.click(screen.getByText('My Workflow'))
    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue('My Workflow')
  })

  it('pressing Escape cancels the edit and restores the original name', async () => {
    renderToolbar()
    await userEvent.click(screen.getByText('My Workflow'))
    await userEvent.clear(screen.getByRole('textbox'))
    await userEvent.type(screen.getByRole('textbox'), 'Changed')
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByText('My Workflow')).toBeInTheDocument()
  })

  it('pressing Enter commits the name via the store', async () => {
    vi.mocked(api.workflows.updateWorkflowName).mockResolvedValue({
      data: { id: 'wf-1', name: 'New Name' },
    } as never)
    renderToolbar()
    await userEvent.click(screen.getByText('My Workflow'))
    await userEvent.clear(screen.getByRole('textbox'))
    await userEvent.type(screen.getByRole('textbox'), 'New Name{Enter}')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(vi.mocked(api.workflows.updateWorkflowName)).toHaveBeenCalledWith(
      'wf-1',
      'New Name'
    )
  })

  it('blurring the input commits the name', async () => {
    vi.mocked(api.workflows.updateWorkflowName).mockResolvedValue({
      data: { id: 'wf-1', name: 'Blurred' },
    } as never)
    renderToolbar()
    await userEvent.click(screen.getByText('My Workflow'))
    await userEvent.clear(screen.getByRole('textbox'))
    await userEvent.type(screen.getByRole('textbox'), 'Blurred')
    await userEvent.tab()
    expect(vi.mocked(api.workflows.updateWorkflowName)).toHaveBeenCalledWith(
      'wf-1',
      'Blurred'
    )
  })

  it('Save button is disabled when isDirty is false', () => {
    renderToolbar()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('Save button is enabled when isDirty is true', () => {
    useCanvasStore.setState({ isDirty: true })
    renderToolbar()
    expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled()
  })

  it('clicking Save calls saveCanvas', async () => {
    vi.mocked(api.workflows.saveCanvas).mockResolvedValue({
      workflow: { id: 'wf-1' },
    } as never)
    useCanvasStore.setState({ isDirty: true })
    renderToolbar()
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(vi.mocked(api.workflows.saveCanvas)).toHaveBeenCalled()
  })

  it('back button navigates to /workflows', async () => {
    renderToolbar()
    await userEvent.click(
      screen.getByRole('button', { name: 'Back to workflows' })
    )
    expect(mockNavigate).toHaveBeenCalledWith('/workflows')
  })

  it('shows an amber dot when isDirty is true', () => {
    useCanvasStore.setState({ isDirty: true })
    renderToolbar()
    expect(screen.getByTitle('Unsaved changes')).toBeInTheDocument()
  })

  it('does not show the dirty dot when isDirty is false', () => {
    renderToolbar()
    expect(screen.queryByTitle('Unsaved changes')).not.toBeInTheDocument()
  })

  it('Run button is disabled when no workflow is loaded', () => {
    useCanvasStore.setState({ workflowId: null })
    renderToolbar()
    expect(screen.getByRole('button', { name: /run/i })).toBeDisabled()
  })

  it('Run button is enabled when a workflow is loaded', () => {
    renderToolbar()
    expect(screen.getByRole('button', { name: /run/i })).not.toBeDisabled()
  })
})

// Undo and redo buttons mirror canUndo/canRedo from the store and call the matching action.
describe('undo/redo buttons', () => {
  it('Undo button is disabled when canUndo is false', () => {
    useCanvasStore.setState({ canUndo: false })
    renderToolbar()
    expect(screen.getByRole('button', { name: /undo/i })).toBeDisabled()
  })

  it('Undo button is enabled when canUndo is true', () => {
    useCanvasStore.setState({ canUndo: true })
    renderToolbar()
    expect(screen.getByRole('button', { name: /undo/i })).not.toBeDisabled()
  })

  it('clicking Undo calls undo on the store', async () => {
    const mockUndo = vi.fn()
    useCanvasStore.setState({ canUndo: true, undo: mockUndo } as never)
    renderToolbar()
    await userEvent.click(screen.getByRole('button', { name: /undo/i }))
    expect(mockUndo).toHaveBeenCalled()
  })

  it('Redo button is disabled when canRedo is false', () => {
    useCanvasStore.setState({ canRedo: false })
    renderToolbar()
    expect(screen.getByRole('button', { name: /redo/i })).toBeDisabled()
  })

  it('Redo button is enabled when canRedo is true', () => {
    useCanvasStore.setState({ canRedo: true })
    renderToolbar()
    expect(screen.getByRole('button', { name: /redo/i })).not.toBeDisabled()
  })

  it('clicking Redo calls redo on the store', async () => {
    const mockRedo = vi.fn()
    useCanvasStore.setState({ canRedo: true, redo: mockRedo } as never)
    renderToolbar()
    await userEvent.click(screen.getByRole('button', { name: /redo/i }))
    expect(mockRedo).toHaveBeenCalled()
  })
})

// Run button checks for a cycle before firing the execution. If a cycle is detected it
// shows a toast.error and skips triggerExecution entirely.
describe('cycle detection on Run', () => {
  const cycleNodes = [
    { id: 'a', type: 'manual-trigger', position: { x: 0, y: 0 }, data: {} },
    { id: 'b', type: 'set-fields', position: { x: 100, y: 0 }, data: {} },
  ]
  const cycleEdges = [
    { id: 'e1', source: 'a', target: 'b' },
    { id: 'e2', source: 'b', target: 'a' },
  ]

  it('shows toast.error and skips triggerExecution when the graph has a cycle', async () => {
    useCanvasStore.setState({
      nodes: cycleNodes as never,
      edges: cycleEdges as never,
    })
    renderToolbar()
    await userEvent.click(screen.getByRole('button', { name: /run/i }))
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
      'Workflow has a cycle',
      expect.any(Object)
    )
    expect(mockTriggerExecution).not.toHaveBeenCalled()
  })

  it('calls triggerExecution when the graph has no cycle', async () => {
    useCanvasStore.setState({
      nodes: cycleNodes as never,
      edges: [{ id: 'e1', source: 'a', target: 'b' }] as never,
    })
    renderToolbar()
    await userEvent.click(screen.getByRole('button', { name: /run/i }))
    expect(vi.mocked(toast.error)).not.toHaveBeenCalled()
    expect(mockTriggerExecution).toHaveBeenCalledWith('wf-1')
  })
})
