import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useCanvasStore } from '@/stores/canvasStore'
import { ConfigPanel } from '@/components/canvas/ConfigPanel'
import { api } from '@/lib/api'
import type { ExecutionNodeRun } from '@triggr/shared'

vi.mock('@/lib/api', () => ({
  api: {
    workflows: {
      saveCanvas: vi.fn(),
      updateWorkflowName: vi.fn(),
    },
    executions: {
      testNode: vi.fn(),
    },
  },
}))

const manualTriggerNode = {
  id: 'n1',
  type: 'manual-trigger',
  position: { x: 0, y: 0 },
  data: { label: 'My Trigger', config: {} },
}

const httpRequestNode = {
  id: 'n2',
  type: 'http-request',
  position: { x: 0, y: 0 },
  data: { label: 'HTTP Request', config: {} },
}

const httpRequestNodeWithConfig = {
  ...httpRequestNode,
  data: {
    label: 'HTTP Request',
    config: { url: 'https://api.example.com', method: 'GET' },
  },
}

function makeNodeRun(
  status: ExecutionNodeRun['status'],
  overrides: Partial<ExecutionNodeRun> = {}
): { nodeRun: ExecutionNodeRun } {
  return {
    nodeRun: {
      id: 'nr-1',
      executionId: 'exec-1',
      nodeId: 'n2',
      status,
      inputData: null,
      outputData: status === 'SUCCESS' ? { result: 'ok' } : null,
      error: status === 'ERROR' ? 'Connection refused' : null,
      retryCount: 0,
      startedAt: '2024-01-01T00:00:00.000Z',
      finishedAt: '2024-01-01T00:00:01.000Z',
      ...overrides,
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  useCanvasStore.getState().reset()
})

// Sidebar panel that displays and edits the selected node's label and configuration.
// Slides in when a node is selected and out when selection is cleared.
describe('ConfigPanel', () => {
  it('has zero width when no node is selected', () => {
    render(<ConfigPanel />)
    const outer = document.querySelector<HTMLElement>('[style*="width: 0"]')
    expect(outer).toBeTruthy()
  })

  it('has non-zero width when a node is selected', () => {
    useCanvasStore.setState({
      nodes: [manualTriggerNode] as never,
      selectedNodeId: 'n1',
    })
    render(<ConfigPanel />)
    const outer = document.querySelector<HTMLElement>('[style*="width: 320"]')
    expect(outer).toBeTruthy()
  })

  it('shows the node type label in the header', () => {
    useCanvasStore.setState({
      nodes: [manualTriggerNode] as never,
      selectedNodeId: 'n1',
    })
    render(<ConfigPanel />)
    // 'Manual Trigger' appears in both the header span and the body placeholder
    expect(screen.getAllByText('Manual Trigger').length).toBeGreaterThanOrEqual(
      1
    )
  })

  it('initialises the label input with the node data label', () => {
    useCanvasStore.setState({
      nodes: [manualTriggerNode] as never,
      selectedNodeId: 'n1',
    })
    render(<ConfigPanel />)
    expect(screen.getByRole('textbox')).toHaveValue('My Trigger')
  })

  it('resets the label input when a different node is selected', async () => {
    const secondNode = {
      id: 'n2',
      type: 'delay',
      position: { x: 0, y: 0 },
      data: { label: 'Wait 5s', config: {} },
    }
    useCanvasStore.setState({
      nodes: [manualTriggerNode, secondNode] as never,
      selectedNodeId: 'n1',
    })
    const { rerender } = render(<ConfigPanel />)
    expect(screen.getByRole('textbox')).toHaveValue('My Trigger')

    useCanvasStore.setState({ selectedNodeId: 'n2' })
    rerender(<ConfigPanel />)
    expect(screen.getByRole('textbox')).toHaveValue('Wait 5s')
  })

  it('commits the label on blur', async () => {
    useCanvasStore.setState({
      workflowId: 'wf-1',
      nodes: [manualTriggerNode] as never,
      selectedNodeId: 'n1',
    })
    render(<ConfigPanel />)
    const input = screen.getByRole('textbox')
    await userEvent.clear(input)
    await userEvent.type(input, 'Renamed Trigger')
    await userEvent.tab()
    const { nodes } = useCanvasStore.getState()
    expect(nodes[0].data.label).toBe('Renamed Trigger')
  })

  it('commits the label on Enter', async () => {
    useCanvasStore.setState({
      workflowId: 'wf-1',
      nodes: [manualTriggerNode] as never,
      selectedNodeId: 'n1',
    })
    render(<ConfigPanel />)
    const input = screen.getByRole('textbox')
    await userEvent.clear(input)
    await userEvent.type(input, 'Enter Name{Enter}')
    const { nodes } = useCanvasStore.getState()
    expect(nodes[0].data.label).toBe('Enter Name')
  })

  it('close button calls selectNode(null)', async () => {
    useCanvasStore.setState({
      nodes: [manualTriggerNode] as never,
      selectedNodeId: 'n1',
    })
    render(<ConfigPanel />)
    await userEvent.click(screen.getByRole('button', { name: 'Close panel' }))
    expect(useCanvasStore.getState().selectedNodeId).toBeNull()
  })
})

// Footer Test Node button: validates config before running, shows loading state,
// displays output on success and the error message on failure.
describe('ConfigPanel – Test Node button', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCanvasStore.getState().reset()
  })

  it('does not render the Test Node button for trigger nodes', () => {
    useCanvasStore.setState({
      nodes: [manualTriggerNode] as never,
      selectedNodeId: 'n1',
    })
    render(<ConfigPanel />)
    expect(screen.queryByRole('button', { name: /test node/i })).toBeNull()
  })

  it('renders the Test Node button for non-trigger nodes', () => {
    useCanvasStore.setState({
      nodes: [httpRequestNode] as never,
      selectedNodeId: 'n2',
    })
    render(<ConfigPanel />)
    expect(
      screen.getByRole('button', { name: /test node/i })
    ).toBeInTheDocument()
  })

  it('shows validation errors and does not call the API when required fields are missing', async () => {
    useCanvasStore.setState({
      workflowId: 'wf-1',
      nodes: [httpRequestNode] as never,
      selectedNodeId: 'n2',
    })
    render(<ConfigPanel />)
    await userEvent.click(screen.getByRole('button', { name: /test node/i }))

    expect(screen.getByText('Fix before testing:')).toBeInTheDocument()
    // The error list renders each field name in a <span> — there are two "url" matches
    // (form label + error item), so we assert at least one exists via getAllByText
    expect(screen.getAllByText(/url/i).length).toBeGreaterThanOrEqual(2)
    expect(vi.mocked(api.executions.testNode)).not.toHaveBeenCalled()
  })

  it('shows the output panel after a successful test', async () => {
    vi.mocked(api.executions.testNode).mockResolvedValue(makeNodeRun('SUCCESS'))
    useCanvasStore.setState({
      workflowId: 'wf-1',
      nodes: [httpRequestNodeWithConfig] as never,
      selectedNodeId: 'n2',
    })
    render(<ConfigPanel />)
    await userEvent.click(screen.getByRole('button', { name: /test node/i }))

    await waitFor(() => expect(screen.getByText('Output')).toBeInTheDocument())
    expect(screen.getByText(/"result": "ok"/)).toBeInTheDocument()
  })

  it('shows the error panel after a failed test', async () => {
    vi.mocked(api.executions.testNode).mockResolvedValue(makeNodeRun('ERROR'))
    useCanvasStore.setState({
      workflowId: 'wf-1',
      nodes: [httpRequestNodeWithConfig] as never,
      selectedNodeId: 'n2',
    })
    render(<ConfigPanel />)
    await userEvent.click(screen.getByRole('button', { name: /test node/i }))

    await waitFor(() => expect(screen.getByText('Error')).toBeInTheDocument())
    expect(screen.getByText('Connection refused')).toBeInTheDocument()
  })

  it('shows the error panel when the API call itself throws', async () => {
    vi.mocked(api.executions.testNode).mockRejectedValue(
      new Error('Network error')
    )
    useCanvasStore.setState({
      workflowId: 'wf-1',
      nodes: [httpRequestNodeWithConfig] as never,
      selectedNodeId: 'n2',
    })
    render(<ConfigPanel />)
    await userEvent.click(screen.getByRole('button', { name: /test node/i }))

    await waitFor(() => expect(screen.getByText('Error')).toBeInTheDocument())
    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('calls testNode with the workflowId, nodeId, and current node data', async () => {
    vi.mocked(api.executions.testNode).mockResolvedValue(makeNodeRun('SUCCESS'))
    useCanvasStore.setState({
      workflowId: 'wf-1',
      nodes: [httpRequestNodeWithConfig] as never,
      selectedNodeId: 'n2',
    })
    render(<ConfigPanel />)
    await userEvent.click(screen.getByRole('button', { name: /test node/i }))

    await waitFor(() =>
      expect(vi.mocked(api.executions.testNode)).toHaveBeenCalledWith(
        'wf-1',
        'n2',
        expect.objectContaining({ id: 'n2', type: 'http-request' })
      )
    )
  })

  it('clears validation errors and test result when a different node is selected', async () => {
    useCanvasStore.setState({
      workflowId: 'wf-1',
      nodes: [httpRequestNode, manualTriggerNode] as never,
      selectedNodeId: 'n2',
    })
    const { rerender } = render(<ConfigPanel />)

    // Trigger validation errors
    await userEvent.click(screen.getByRole('button', { name: /test node/i }))
    expect(screen.getByText('Fix before testing:')).toBeInTheDocument()

    // Switch to the trigger node (no Test Node button, errors gone)
    useCanvasStore.setState({ selectedNodeId: 'n1' })
    rerender(<ConfigPanel />)

    expect(screen.queryByText('Fix before testing:')).toBeNull()
    expect(screen.queryByRole('button', { name: /test node/i })).toBeNull()
  })
})
