import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { useCanvasStore } from '@/stores/canvasStore'
import { CanvasToolbar } from '@/components/canvas/CanvasToolbar'

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

function renderToolbar() {
  return render(
    <MemoryRouter>
      <CanvasToolbar />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  useCanvasStore.getState().reset()
  useCanvasStore.setState({
    workflowId: 'wf-1',
    workflowName: 'My Workflow',
    workflowStatus: 'DRAFT',
    isDirty: false,
    isSaving: false,
  })
})

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

  it('Run button is always disabled', () => {
    renderToolbar()
    expect(screen.getByRole('button', { name: /run/i })).toBeDisabled()
  })
})
