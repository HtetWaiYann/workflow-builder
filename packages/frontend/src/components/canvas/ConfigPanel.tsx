import * as React from 'react'
import { X } from 'lucide-react'
import type { NodeType } from '@workflow-builder/shared'
import { useCanvasStore } from '@/stores/canvasStore'
import { getNodeDefinition, ICON_MAP } from '@/lib/nodeRegistry'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NodeConfigForm } from '@/components/canvas/NodeConfigForm'
import { ErrorConfigForm } from '@/components/canvas/NodeConfigForm/ErrorConfigForm'
import { NodeDocsButton } from '@/components/canvas/NodeDocs'

interface NodeLabelInputProps {
  initialLabel: string
  onCommit: (label: string) => void
}

function NodeLabelInput({ initialLabel, onCommit }: NodeLabelInputProps) {
  const [value, setValue] = React.useState(initialLabel)

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      const trimmed = value.trim()
      if (trimmed) onCommit(trimmed)
    }
  }

  function handleBlur() {
    const trimmed = value.trim()
    if (trimmed) onCommit(trimmed)
  }

  return (
    <Input
      className="h-8 text-sm"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  )
}

export function ConfigPanel() {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId)
  const nodes = useCanvasStore((s) => s.nodes)
  const selectNode = useCanvasStore((s) => s.selectNode)
  const updateNodeLabel = useCanvasStore((s) => s.updateNodeLabel)
  const updateNodeConfig = useCanvasStore((s) => s.updateNodeConfig)
  const updateNodeErrorConfig = useCanvasStore((s) => s.updateNodeErrorConfig)

  const selectedNode = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId)
    : null

  const nodeType = selectedNode
    ? ((selectedNode.type as NodeType | undefined) ?? 'manual-trigger')
    : 'manual-trigger'
  const def = selectedNode ? getNodeDefinition(nodeType) : null
  const IconComponent = def ? ICON_MAP[def.icon] : null
  const isTrigger = def?.group === 'Triggers'

  const nodeConfig = (selectedNode?.data.config ?? {}) as Record<
    string,
    unknown
  >
  const nodeErrorConfig = (selectedNode?.data.errorConfig ?? {}) as Record<
    string,
    unknown
  >

  return (
    <div
      style={{ width: selectedNodeId ? 320 : 0 }}
      className="flex-shrink-0 overflow-hidden border-l transition-all duration-200 ease-in-out"
    >
      <div className="flex h-full w-[320px] flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 border-b px-3 py-2.5">
          {def && IconComponent && (
            <IconComponent
              size={15}
              style={{ color: def.color }}
              className="shrink-0"
            />
          )}
          <span className="text-muted-foreground flex-1 truncate text-sm font-medium">
            {def?.label ?? ''}
          </span>
          {selectedNode && (
            <NodeDocsButton nodeType={nodeType} nodeLabel={def?.label ?? ''} />
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => selectNode(null)}
            aria-label="Close panel"
          >
            <X className="size-3.5" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
          {/* Node name */}
          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs font-medium">
              Node name
            </label>
            <NodeLabelInput
              key={selectedNodeId ?? ''}
              initialLabel={
                (selectedNode?.data.label as string | undefined) ??
                def?.label ??
                ''
              }
              onCommit={(label) => {
                if (selectedNodeId) updateNodeLabel(selectedNodeId, label)
              }}
            />
          </div>

          {/* Node config form */}
          {selectedNode && (
            <NodeConfigForm
              key={selectedNodeId ?? ''}
              nodeType={nodeType}
              config={nodeConfig}
              onChange={(config) => {
                if (selectedNodeId) updateNodeConfig(selectedNodeId, config)
              }}
            />
          )}

          {/* Error handling — not shown for trigger nodes */}
          {selectedNode && !isTrigger && (
            <div className="space-y-2">
              <div className="border-t pt-3">
                <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
                  Error Handling
                </p>
                <ErrorConfigForm
                  key={selectedNodeId ?? ''}
                  errorConfig={nodeErrorConfig}
                  onChange={(errorConfig) => {
                    if (selectedNodeId)
                      updateNodeErrorConfig(selectedNodeId, errorConfig)
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-3 py-2.5">
          <Button className="h-8 w-full text-sm" variant="outline" disabled>
            Test Node
          </Button>
        </div>
      </div>
    </div>
  )
}
