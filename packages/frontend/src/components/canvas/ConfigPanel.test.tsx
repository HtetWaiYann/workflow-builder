import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useCanvasStore } from '@/stores/canvasStore'
import { ConfigPanel } from '@/components/canvas/ConfigPanel'

vi.mock('@/lib/api', () => ({
  api: {
    workflows: {
      saveCanvas: vi.fn(),
      updateWorkflowName: vi.fn(),
    },
  },
}))

const manualTriggerNode = {
  id: 'n1',
  type: 'manual-trigger',
  position: { x: 0, y: 0 },
  data: { label: 'My Trigger', config: {} },
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
