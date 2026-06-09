import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useExecutionStore } from '@/stores/executionStore'
import { useCanvasStore } from '@/stores/canvasStore'
import { RunPanel } from '@/components/canvas/RunPanel'
import type { Execution } from '@triggr/shared'

vi.mock('@/lib/api', () => ({
  api: {
    workflows: {
      get: vi.fn(),
      saveCanvas: vi.fn(),
      updateWorkflowName: vi.fn(),
      activate: vi.fn(),
      deactivate: vi.fn(),
    },
    executions: {
      trigger: vi.fn(),
      get: vi.fn(),
      list: vi.fn(),
    },
  },
}))

function makeExecution(
  status: Execution['status'],
  nodeRuns: Execution['nodeRuns'] = []
): Execution {
  return {
    id: 'exec-1',
    workflowId: 'wf-1',
    status,
    inputData: null,
    startedAt: '2024-01-01T00:00:00.000Z',
    finishedAt:
      status === 'SUCCESS' || status === 'ERROR'
        ? '2024-01-01T00:00:01.000Z'
        : null,
    createdAt: '2024-01-01T00:00:00.000Z',
    nodeRuns,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  useExecutionStore.getState().reset()
  useCanvasStore.getState().reset()
})

// Bottom sliding panel showing the result of the most recent workflow execution.
// Renders node run rows with expandable output/error details.
describe('RunPanel', () => {
  it('renders nothing when showRunPanel is false', () => {
    const { container } = render(<RunPanel />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the panel header when showRunPanel is true', () => {
    useExecutionStore.setState({ showRunPanel: true })
    render(<RunPanel />)
    expect(screen.getByText('Run Results')).toBeInTheDocument()
  })

  it('shows "Starting…" badge while isTriggering is true and no execution exists yet', () => {
    useExecutionStore.setState({ showRunPanel: true, isTriggering: true })
    render(<RunPanel />)
    expect(screen.getByText('Starting…')).toBeInTheDocument()
  })

  it('shows "Triggering run…" placeholder in the body while triggering with no execution', () => {
    useExecutionStore.setState({ showRunPanel: true, isTriggering: true })
    render(<RunPanel />)
    expect(screen.getByText('Triggering run…')).toBeInTheDocument()
  })

  it('shows the execution status badge when an execution exists', () => {
    useExecutionStore.setState({
      showRunPanel: true,
      currentExecution: makeExecution('SUCCESS'),
    })
    render(<RunPanel />)
    expect(screen.getByText('Success')).toBeInTheDocument()
  })

  it('shows ERROR status badge for a failed execution', () => {
    useExecutionStore.setState({
      showRunPanel: true,
      currentExecution: makeExecution('ERROR'),
    })
    render(<RunPanel />)
    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('shows "No nodes" message when execution has an empty node runs list', () => {
    useExecutionStore.setState({
      showRunPanel: true,
      currentExecution: makeExecution('SUCCESS', []),
    })
    render(<RunPanel />)
    expect(screen.getByText('No nodes in this workflow.')).toBeInTheDocument()
  })

  it('renders a row for each node run using the canvas node label', () => {
    useCanvasStore.setState({
      nodes: [
        {
          id: 'n1',
          type: 'set-fields',
          position: { x: 0, y: 0 },
          data: { label: 'Set Name' },
        },
        {
          id: 'n2',
          type: 'send-email',
          position: { x: 100, y: 0 },
          data: { label: 'Send Alert' },
        },
      ] as never,
    })
    useExecutionStore.setState({
      showRunPanel: true,
      currentExecution: makeExecution('SUCCESS', [
        {
          id: 'nr-1',
          executionId: 'exec-1',
          nodeId: 'n1',
          status: 'SUCCESS',
          inputData: null,
          outputData: null,
          error: null,
          retryCount: 0,
          startedAt: null,
          finishedAt: null,
        },
        {
          id: 'nr-2',
          executionId: 'exec-1',
          nodeId: 'n2',
          status: 'SUCCESS',
          inputData: null,
          outputData: null,
          error: null,
          retryCount: 0,
          startedAt: null,
          finishedAt: null,
        },
      ]),
    })
    render(<RunPanel />)
    expect(screen.getByText('Set Name')).toBeInTheDocument()
    expect(screen.getByText('Send Alert')).toBeInTheDocument()
  })

  it('close button calls closeRunPanel', async () => {
    useExecutionStore.setState({ showRunPanel: true })
    render(<RunPanel />)
    await userEvent.click(
      screen.getByRole('button', { name: 'Close run panel' })
    )
    expect(useExecutionStore.getState().showRunPanel).toBe(false)
  })

  it('expanding a node run row with outputData shows the JSON', async () => {
    useExecutionStore.setState({
      showRunPanel: true,
      currentExecution: makeExecution('SUCCESS', [
        {
          id: 'nr-1',
          executionId: 'exec-1',
          nodeId: 'n1',
          status: 'SUCCESS',
          inputData: null,
          outputData: { name: 'alice' },
          error: null,
          retryCount: 0,
          startedAt: null,
          finishedAt: null,
        },
      ]),
    })
    render(<RunPanel />)
    await userEvent.click(screen.getByRole('button', { name: /n1/i }))
    expect(screen.getByText(/"name": "alice"/)).toBeInTheDocument()
  })

  it('expanding a node run row with an error shows the error message', async () => {
    useExecutionStore.setState({
      showRunPanel: true,
      currentExecution: makeExecution('ERROR', [
        {
          id: 'nr-1',
          executionId: 'exec-1',
          nodeId: 'n1',
          status: 'ERROR',
          inputData: null,
          outputData: null,
          error: 'executor crashed',
          retryCount: 0,
          startedAt: null,
          finishedAt: null,
        },
      ]),
    })
    render(<RunPanel />)
    await userEvent.click(screen.getByRole('button', { name: /n1/i }))
    expect(screen.getByText('executor crashed')).toBeInTheDocument()
  })

  it('does not expand a row that has no output or error', async () => {
    useExecutionStore.setState({
      showRunPanel: true,
      currentExecution: makeExecution('SUCCESS', [
        {
          id: 'nr-1',
          executionId: 'exec-1',
          nodeId: 'n1',
          status: 'PENDING',
          inputData: null,
          outputData: null,
          error: null,
          retryCount: 0,
          startedAt: null,
          finishedAt: null,
        },
      ]),
    })
    render(<RunPanel />)
    const row = screen.getByRole('button', { name: /n1/i })
    expect(row).toBeDisabled()
  })
})
