import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WorkflowNode } from '@/components/canvas/WorkflowNode'
import type { NodeProps } from '@xyflow/react'

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
