import * as React from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ConnectionMode,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
} from '@xyflow/react'
import type {
  NodeChange,
  EdgeChange,
  Connection,
  NodeTypes,
} from '@xyflow/react'
import type { NodeType } from '@triggr/shared'
import { useCanvasStore } from '@/stores/canvasStore'
import { useThemeStore } from '@/stores/themeStore'
import { WorkflowNode } from './WorkflowNode'

const nodeTypes: NodeTypes = {
  'manual-trigger': WorkflowNode,
  'webhook-trigger': WorkflowNode,
  'cron-trigger': WorkflowNode,
  'http-request': WorkflowNode,
  'run-js-code': WorkflowNode,
  'if-condition': WorkflowNode,
  switch: WorkflowNode,
  merge: WorkflowNode,
  'set-fields': WorkflowNode,
  'filter-array': WorkflowNode,
  'rename-keys': WorkflowNode,
  'slack-message': WorkflowNode,
  'send-email': WorkflowNode,
  delay: WorkflowNode,
}

function CanvasFlow() {
  const { screenToFlowPosition } = useReactFlow()

  const nodes = useCanvasStore((s) => s.nodes)
  const edges = useCanvasStore((s) => s.edges)
  const setNodes = useCanvasStore((s) => s.setNodes)
  const setEdges = useCanvasStore((s) => s.setEdges)
  const selectNode = useCanvasStore((s) => s.selectNode)
  const markDirty = useCanvasStore((s) => s.markDirty)
  const addNode = useCanvasStore((s) => s.addNode)
  const pushHistory = useCanvasStore((s) => s.pushHistory)

  const theme = useThemeStore((s) => s.theme)
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

  // Tracks whether a node drag is currently in progress to avoid pushing
  // a history snapshot on every drag-move frame (only push on drag start).
  const isDraggingRef = React.useRef(false)

  function onNodesChange(changes: NodeChange[]) {
    const hasRemove = changes.some((c) => c.type === 'remove')
    const dragStarting =
      !isDraggingRef.current &&
      changes.some(
        (c) => c.type === 'position' && 'dragging' in c && c.dragging === true
      )

    if (hasRemove || dragStarting) {
      pushHistory()
    }

    isDraggingRef.current = changes.some(
      (c) => c.type === 'position' && 'dragging' in c && c.dragging === true
    )

    setNodes(applyNodeChanges(changes, nodes))
  }

  function onEdgesChange(changes: EdgeChange[]) {
    if (changes.some((c) => c.type === 'remove')) {
      pushHistory()
    }
    setEdges(applyEdgeChanges(changes, edges))
  }

  function onConnect(connection: Connection) {
    pushHistory()
    setEdges(addEdge(connection, edges))
    markDirty()
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const type = e.dataTransfer.getData('application/reactflow') as NodeType
    if (!type) return
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    addNode(type, position)
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={(_, node) => selectNode(node.id)}
      onPaneClick={() => selectNode(null)}
      onDragOver={onDragOver}
      onDrop={onDrop}
      deleteKeyCode={['Backspace', 'Delete']}
      multiSelectionKeyCode="Shift"
      connectionMode={ConnectionMode.Strict}
      fitView
      fitViewOptions={{ maxZoom: 0.95 }}
      className="bg-zinc-100 dark:bg-zinc-950"
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1}
        color={isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.1)'}
      />
      <Controls position="bottom-left" showInteractive={false} />
      <MiniMap
        position="bottom-right"
        nodeColor={isDark ? 'oklch(0.36 0.008 264)' : 'oklch(0.7 0 0)'}
        maskColor={isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.04)'}
      />
    </ReactFlow>
  )
}

export function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasFlow />
    </ReactFlowProvider>
  )
}
