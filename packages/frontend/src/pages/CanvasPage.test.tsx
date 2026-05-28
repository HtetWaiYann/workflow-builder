import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import * as React from 'react'

// ── Stub heavyweight child components ─────────────────────────────────────────
vi.mock('@/components/canvas/CanvasToolbar', () => ({
  CanvasToolbar: () => <div data-testid="canvas-toolbar" />,
}))
vi.mock('@/components/canvas/NodePalette', () => ({
  NodePalette: () => <div data-testid="node-palette" />,
}))
vi.mock('@/components/canvas/WorkflowCanvas', () => ({
  WorkflowCanvas: () => <div data-testid="workflow-canvas" />,
}))
vi.mock('@/components/canvas/ConfigPanel', () => ({
  ConfigPanel: () => <div data-testid="config-panel" />,
}))
vi.mock('@/components/canvas/RunPanel', () => ({
  RunPanel: () => <div data-testid="run-panel" />,
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), warning: vi.fn() },
}))

// ── Router mocks ──────────────────────────────────────────────────────────────
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useParams: vi.fn().mockReturnValue({ id: 'wf-1' }),
    useNavigate: () => mockNavigate,
  }
})

// ── Store mocks ───────────────────────────────────────────────────────────────
const mockLoadWorkflow = vi.fn()
const mockReset = vi.fn()
const mockUndo = vi.fn()
const mockRedo = vi.fn()
const mockResetExecution = vi.fn()

const canvasState = {
  isLoading: false,
  error: null as string | null,
  loadWorkflow: mockLoadWorkflow,
  reset: mockReset,
  undo: mockUndo,
  redo: mockRedo,
}

const executionState = {
  reset: mockResetExecution,
}

vi.mock('@/stores/canvasStore', () => ({
  useCanvasStore: (selector: (s: typeof canvasState) => unknown) =>
    selector(canvasState),
}))

vi.mock('@/stores/executionStore', () => ({
  useExecutionStore: (selector: (s: typeof executionState) => unknown) =>
    selector(executionState),
}))

import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { CanvasPage } from '@/pages/CanvasPage'

function renderPage() {
  return render(<CanvasPage />)
}

beforeEach(() => {
  vi.clearAllMocks()
  canvasState.isLoading = false
  canvasState.error = null
  vi.mocked(useParams).mockReturnValue({ id: 'wf-1' })
})

// Top-level page that bootstraps the canvas: loads the workflow, resets stores on
// mount/unmount, wires keyboard shortcuts, and redirects on NOT_FOUND errors.
describe('CanvasPage — initial load', () => {
  it('calls loadWorkflow with the route id on mount', () => {
    renderPage()
    expect(mockLoadWorkflow).toHaveBeenCalledWith('wf-1')
  })

  it('calls reset on both stores on mount', () => {
    renderPage()
    expect(mockReset).toHaveBeenCalled()
    expect(mockResetExecution).toHaveBeenCalled()
  })

  it('calls reset on both stores on unmount', () => {
    const { unmount } = renderPage()
    mockReset.mockClear()
    mockResetExecution.mockClear()
    unmount()
    expect(mockReset).toHaveBeenCalled()
    expect(mockResetExecution).toHaveBeenCalled()
  })

  it('redirects to /workflows when id param is missing', () => {
    vi.mocked(useParams).mockReturnValue({ id: undefined })
    renderPage()
    expect(mockNavigate).toHaveBeenCalledWith('/workflows', { replace: true })
  })

  it('does not call loadWorkflow when id is missing', () => {
    vi.mocked(useParams).mockReturnValue({ id: undefined })
    renderPage()
    expect(mockLoadWorkflow).not.toHaveBeenCalled()
  })
})

describe('CanvasPage — loading state', () => {
  it('shows a loading indicator while isLoading is true', () => {
    canvasState.isLoading = true
    renderPage()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('does not render WorkflowCanvas while loading', () => {
    canvasState.isLoading = true
    renderPage()
    expect(screen.queryByTestId('workflow-canvas')).not.toBeInTheDocument()
  })

  it('renders WorkflowCanvas after loading completes', () => {
    canvasState.isLoading = false
    renderPage()
    expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument()
  })
})

describe('CanvasPage — error handling', () => {
  it('shows toast.error and navigates away when error is WORKFLOW_NOT_FOUND', () => {
    canvasState.isLoading = false
    canvasState.error = 'WORKFLOW_NOT_FOUND'
    renderPage()
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Workflow not found')
    expect(mockNavigate).toHaveBeenCalledWith('/workflows', { replace: true })
  })

  it('does not navigate for other error codes', () => {
    canvasState.isLoading = false
    canvasState.error = 'SOME_OTHER_ERROR'
    renderPage()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('does not show a toast while still loading', () => {
    canvasState.isLoading = true
    canvasState.error = 'WORKFLOW_NOT_FOUND'
    renderPage()
    expect(vi.mocked(toast.error)).not.toHaveBeenCalled()
  })
})

describe('CanvasPage — keyboard shortcuts', () => {
  it('calls undo when Ctrl+Z is pressed outside an input', () => {
    renderPage()
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true })
      )
    })
    expect(mockUndo).toHaveBeenCalled()
  })

  it('calls undo when Meta+Z is pressed (Mac)', () => {
    renderPage()
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', metaKey: true, bubbles: true })
      )
    })
    expect(mockUndo).toHaveBeenCalled()
  })

  it('calls redo when Ctrl+Y is pressed', () => {
    renderPage()
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'y', ctrlKey: true, bubbles: true })
      )
    })
    expect(mockRedo).toHaveBeenCalled()
  })

  it('calls redo when Ctrl+Shift+Z is pressed', () => {
    renderPage()
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'z',
          ctrlKey: true,
          shiftKey: true,
          bubbles: true,
        })
      )
    })
    expect(mockRedo).toHaveBeenCalled()
  })

  it('does not call undo when Ctrl+Z is pressed inside an INPUT element', () => {
    renderPage()
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    act(() => {
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true })
      )
    })
    expect(mockUndo).not.toHaveBeenCalled()
    input.remove()
  })

  it('removes the keydown listener on unmount', () => {
    const { unmount } = renderPage()
    unmount()
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true })
      )
    })
    expect(mockUndo).not.toHaveBeenCalled()
  })
})
