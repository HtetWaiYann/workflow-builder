import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WorkflowNode } from '@/components/canvas/WorkflowNode'
import { useExecutionStore } from '@/stores/executionStore'
import type { NodeProps } from '@xyflow/react'
import type { NodeRunStatus } from '@triggr/shared'

vi.mock('@/lib/api', () => ({
  api: {
    executions: { trigger: vi.fn(), get: vi.fn(), list: vi.fn() },
  },
}))

vi.mock('@xyflow/react', () => ({
  Handle: () => null,
  Position: { Left: 'left', Right: 'right' },
}))

function makeProps(overrides: Partial<NodeProps> = {}): NodeProps {
  return {
    id: 'n1',
    type: 'manual-trigger',
    data: { label: 'My Node', config: {} },
    selected: false,
    isConnectable: true,
    zIndex: 0,
    xPos: 0,
    yPos: 0,
    dragging: false,
    deletable: true,
    selectable: true,
    draggable: true,
    ...overrides,
  } as NodeProps
}

beforeEach(() => {
  useExecutionStore.getState().reset()
})

function setNodeRun(nodeId: string, status: NodeRunStatus) {
  useExecutionStore.setState({
    currentExecution: {
      id: 'exec-1',
      workflowId: 'wf-1',
      status: 'RUNNING',
      inputData: null,
      startedAt: '2024-01-01T00:00:00.000Z',
      finishedAt: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      nodeRuns: [
        {
          id: 'nr-1',
          executionId: 'exec-1',
          nodeId,
          status,
          inputData: null,
          outputData: null,
          error: null,
          retryCount: 0,
          startedAt: null,
          finishedAt: null,
        },
      ],
    },
  })
}

// Custom React Flow node component shared by all workflow node types. Renders the node
// label, description, and a selection border based on the node's registry entry.
describe('WorkflowNode', () => {
  it('renders data.label as the node name', () => {
    render(
      <WorkflowNode
        {...makeProps({ data: { label: 'Custom Label', config: {} } })}
      />
    )
    expect(screen.getByText('Custom Label')).toBeInTheDocument()
  })

  it('falls back to the registry label when data.label is not set', () => {
    render(<WorkflowNode {...makeProps({ data: { config: {} } })} />)
    expect(screen.getByText('Manual Trigger')).toBeInTheDocument()
  })

  it('renders the node description from the registry', () => {
    render(<WorkflowNode {...makeProps()} />)
    expect(screen.getByText('Start workflow manually')).toBeInTheDocument()
  })

  it('applies no inline border style when not selected', () => {
    const { container } = render(
      <WorkflowNode {...makeProps({ selected: false })} />
    )
    const node = container.firstChild as HTMLElement
    expect(node.style.border).toBe('')
  })

  it('applies an inline accent-colored border when selected', () => {
    const { container } = render(
      <WorkflowNode {...makeProps({ selected: true })} />
    )
    const node = container.firstChild as HTMLElement
    expect(node.style.border).toMatch(/solid/)
    expect(node.style.boxShadow).toMatch(/0 0 0 3px/)
  })

  it('renders correctly for the delay node type', () => {
    render(
      <WorkflowNode
        {...makeProps({ type: 'delay', data: { label: 'Wait', config: {} } })}
      />
    )
    expect(screen.getByText('Wait')).toBeInTheDocument()
    expect(screen.getByText('Wait before continuing')).toBeInTheDocument()
  })
})

// When an execution is in progress the node border changes colour to reflect the run
// status. The selected-state border always takes priority over the status border.
describe('execution status border', () => {
  it('shows no border when there is no active node run', () => {
    const { container } = render(
      <WorkflowNode {...makeProps({ id: 'n1', selected: false })} />
    )
    expect((container.firstChild as HTMLElement).style.border).toBe('')
  })

  it('applies a yellow border for RUNNING status', () => {
    setNodeRun('n1', 'RUNNING')
    const { container } = render(
      <WorkflowNode {...makeProps({ id: 'n1', selected: false })} />
    )
    // jsdom normalises hex+alpha to rgba — yellow-400 at ~60% opacity
    expect((container.firstChild as HTMLElement).style.border).toContain(
      'rgba(250, 204, 21'
    )
  })

  it('applies a green border for SUCCESS status', () => {
    setNodeRun('n1', 'SUCCESS')
    const { container } = render(
      <WorkflowNode {...makeProps({ id: 'n1', selected: false })} />
    )
    // green-500 at ~60% opacity
    expect((container.firstChild as HTMLElement).style.border).toContain(
      'rgba(34, 197, 94'
    )
  })

  it('applies a red border for ERROR status', () => {
    setNodeRun('n1', 'ERROR')
    const { container } = render(
      <WorkflowNode {...makeProps({ id: 'n1', selected: false })} />
    )
    // red-500 at ~60% opacity
    expect((container.firstChild as HTMLElement).style.border).toContain(
      'rgba(239, 68, 68'
    )
  })

  it('shows no status border for PENDING status', () => {
    setNodeRun('n1', 'PENDING')
    const { container } = render(
      <WorkflowNode {...makeProps({ id: 'n1', selected: false })} />
    )
    expect((container.firstChild as HTMLElement).style.border).toBe('')
  })

  it('shows no status border for SKIPPED status', () => {
    setNodeRun('n1', 'SKIPPED')
    const { container } = render(
      <WorkflowNode {...makeProps({ id: 'n1', selected: false })} />
    )
    expect((container.firstChild as HTMLElement).style.border).toBe('')
  })

  it('selected state overrides the status border with the accent color', () => {
    setNodeRun('n1', 'ERROR')
    const { container } = render(
      <WorkflowNode {...makeProps({ id: 'n1', selected: true })} />
    )
    // Should use the node's accent color, not the red error color
    const border = (container.firstChild as HTMLElement).style.border
    expect(border).not.toContain('ef4444')
    expect(border).toMatch(/solid/)
  })

  it('renders the status dot in the header for any nodeRun status', () => {
    setNodeRun('n1', 'SUCCESS')
    const { container } = render(<WorkflowNode {...makeProps({ id: 'n1' })} />)
    expect(container.querySelector('.bg-green-500')).toBeInTheDocument()
  })
})
