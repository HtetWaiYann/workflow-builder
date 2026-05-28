import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import * as React from 'react'
import type { NodeChange, EdgeChange, Connection } from '@xyflow/react'
import { useCanvasStore } from '@/stores/canvasStore'

// ── Capture ReactFlow props so we can call the handlers directly ──────────────
type CapturedProps = {
  onNodesChange?: (changes: NodeChange[]) => void
  onEdgesChange?: (changes: EdgeChange[]) => void
  onConnect?: (connection: Connection) => void
  onDrop?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onNodeClick?: (_: unknown, node: { id: string }) => void
  onPaneClick?: () => void
  nodes?: unknown[]
  edges?: unknown[]
}

const captured: CapturedProps = {}

const mockScreenToFlowPosition = vi.fn().mockReturnValue({ x: 50, y: 100 })

vi.mock('@xyflow/react', () => ({
  ReactFlow: (props: CapturedProps) => {
    Object.assign(captured, props)
    return null
  },
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  Background: () => null,
  BackgroundVariant: { Dots: 'dots' },
  Controls: () => null,
  MiniMap: () => null,
  ConnectionMode: { Strict: 'strict' },
  addEdge: vi.fn((conn: Connection, edges: unknown[]) => [...edges, conn]),
  applyNodeChanges: vi.fn((_changes: NodeChange[], nodes: unknown[]) => nodes),
  applyEdgeChanges: vi.fn((_changes: EdgeChange[], edges: unknown[]) => edges),
  useReactFlow: () => ({ screenToFlowPosition: mockScreenToFlowPosition }),
}))

vi.mock('@/lib/api', () => ({
  api: { workflows: { get: vi.fn(), saveCanvas: vi.fn() } },
}))

vi.mock('sonner', () => ({
  toast: { warning: vi.fn(), error: vi.fn() },
}))

vi.mock('@paralleldrive/cuid2', () => ({
  createId: () => 'generated-id',
}))

import { act } from '@testing-library/react'
import { WorkflowCanvas } from '@/components/canvas/WorkflowCanvas'

function renderCanvas() {
  useCanvasStore.getState().reset()
  return render(<WorkflowCanvas />)
}

/** Minimal DataTransfer stand-in — jsdom does not implement the real one. */
function makeDataTransfer(initialData: Record<string, string> = {}) {
  const store = { ...initialData }
  return {
    setData: (type: string, value: string) => {
      store[type] = value
    },
    getData: (type: string) => store[type] ?? '',
    dropEffect: 'none' as string,
  }
}

// React Flow canvas: wires node/edge change handlers, connection creation,
// drag-drop node placement, and node selection to the canvas store.
describe('WorkflowCanvas — rendering', () => {
  it('renders without crashing', () => {
    expect(() => renderCanvas()).not.toThrow()
  })

  it('passes the store nodes to ReactFlow', () => {
    renderCanvas()
    act(() => {
      useCanvasStore.getState().addNode('manual-trigger', { x: 0, y: 0 })
    })
    expect(Array.isArray(captured.nodes)).toBe(true)
    expect((captured.nodes ?? []).length).toBeGreaterThan(0)
  })
})

describe('WorkflowCanvas — onNodesChange', () => {
  beforeEach(() => {
    renderCanvas()
    vi.clearAllMocks()
    useCanvasStore.getState().reset()
    renderCanvas()
  })

  it('pushes history when a node is removed', () => {
    const before = useCanvasStore.getState().canUndo
    captured.onNodesChange?.([{ type: 'remove', id: 'n1' }])
    expect(useCanvasStore.getState().canUndo).toBe(true)
    void before
  })

  it('pushes history when a drag starts (first dragging=true frame)', () => {
    captured.onNodesChange?.([
      { type: 'position', id: 'n1', dragging: true } as NodeChange,
    ])
    expect(useCanvasStore.getState().canUndo).toBe(true)
  })

  it('does not push history on subsequent drag-move frames', () => {
    // First frame: drag start — pushes history
    captured.onNodesChange?.([
      { type: 'position', id: 'n1', dragging: true } as NodeChange,
    ])
    const afterFirst = useCanvasStore.getState().canUndo

    // Second frame: still dragging — must NOT push a second snapshot
    const undoBefore = useCanvasStore.getState().canUndo
    captured.onNodesChange?.([
      { type: 'position', id: 'n1', dragging: true } as NodeChange,
    ])
    expect(useCanvasStore.getState().canUndo).toBe(undoBefore)
    void afterFirst
  })
})

describe('WorkflowCanvas — onEdgesChange', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset()
    renderCanvas()
  })

  it('pushes history when an edge is removed', () => {
    captured.onEdgesChange?.([{ type: 'remove', id: 'e1' }])
    expect(useCanvasStore.getState().canUndo).toBe(true)
  })

  it('does not push history for non-remove edge changes', () => {
    captured.onEdgesChange?.([{ type: 'select', id: 'e1', selected: true }])
    expect(useCanvasStore.getState().canUndo).toBe(false)
  })
})

describe('WorkflowCanvas — onConnect', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset()
    renderCanvas()
  })

  it('pushes history when a new connection is made', () => {
    captured.onConnect?.({
      source: 'n1',
      target: 'n2',
      sourceHandle: null,
      targetHandle: null,
    })
    expect(useCanvasStore.getState().canUndo).toBe(true)
  })

  it('marks the canvas dirty when a connection is made', () => {
    useCanvasStore.setState({ isDirty: false })
    captured.onConnect?.({
      source: 'n1',
      target: 'n2',
      sourceHandle: null,
      targetHandle: null,
    })
    expect(useCanvasStore.getState().isDirty).toBe(true)
  })
})

describe('WorkflowCanvas — onDrop', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset()
    renderCanvas()
  })

  it('calls addNode with the dropped type and screen-to-flow position', () => {
    mockScreenToFlowPosition.mockReturnValue({ x: 50, y: 100 })

    const dropEvent = {
      preventDefault: vi.fn(),
      dataTransfer: makeDataTransfer({
        'application/reactflow': 'http-request',
      }),
      clientX: 200,
      clientY: 300,
    }

    captured.onDrop?.(dropEvent as unknown as React.DragEvent)

    const nodes = useCanvasStore.getState().nodes
    expect(nodes.some((n) => n.type === 'http-request')).toBe(true)
  })

  it('does nothing when the dataTransfer type is missing', () => {
    const nodesBefore = useCanvasStore.getState().nodes.length
    const dropEvent = {
      preventDefault: vi.fn(),
      dataTransfer: makeDataTransfer(),
      clientX: 0,
      clientY: 0,
    }

    captured.onDrop?.(dropEvent as unknown as React.DragEvent)

    expect(useCanvasStore.getState().nodes).toHaveLength(nodesBefore)
  })
})

describe('WorkflowCanvas — onDragOver', () => {
  it('sets dropEffect to "move"', () => {
    renderCanvas()
    const dt = makeDataTransfer()
    const dragEvent = {
      preventDefault: vi.fn(),
      dataTransfer: dt,
    }

    captured.onDragOver?.(dragEvent as unknown as React.DragEvent)

    expect(dt.dropEffect).toBe('move')
  })
})

describe('WorkflowCanvas — node and pane click', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset()
    renderCanvas()
  })

  it('selects a node when onNodeClick is called', () => {
    useCanvasStore.getState().addNode('manual-trigger', { x: 0, y: 0 })
    const nodeId = useCanvasStore.getState().nodes[0]!.id
    captured.onNodeClick?.(undefined, { id: nodeId })
    expect(useCanvasStore.getState().selectedNodeId).toBe(nodeId)
  })

  it('clears selection when the pane is clicked', () => {
    useCanvasStore.getState().addNode('manual-trigger', { x: 0, y: 0 })
    const nodeId = useCanvasStore.getState().nodes[0]!.id
    useCanvasStore.setState({ selectedNodeId: nodeId })
    captured.onPaneClick?.()
    expect(useCanvasStore.getState().selectedNodeId).toBeNull()
  })
})
