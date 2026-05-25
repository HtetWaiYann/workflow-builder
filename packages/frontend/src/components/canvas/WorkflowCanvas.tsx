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
import type { NodeType } from '@workflow-builder/shared'
import { useCanvasStore } from '@/stores/canvasStore'
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

  function onNodesChange(changes: NodeChange[]) {
    setNodes(applyNodeChanges(changes, nodes))
  }

  function onEdgesChange(changes: EdgeChange[]) {
    setEdges(applyEdgeChanges(changes, edges))
  }

  function onConnect(connection: Connection) {
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
      className="bg-zinc-950 dark:bg-zinc-950"
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1}
        color="rgba(255,255,255,0.07)"
      />
      <Controls position="bottom-left" showInteractive={false} />
      <MiniMap
        position="bottom-right"
        nodeColor="oklch(0.36 0.008 264)"
        maskColor="rgba(0,0,0,0.55)"
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
