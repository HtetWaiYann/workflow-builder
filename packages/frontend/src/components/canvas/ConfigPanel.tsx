import * as React from 'react'
import { X } from 'lucide-react'
import type { NodeType } from '@workflow-builder/shared'
import { useCanvasStore } from '@/stores/canvasStore'
import { getNodeDefinition, ICON_MAP } from '@/lib/nodeRegistry'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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

  const selectedNode = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId)
    : null

  const nodeType = selectedNode
    ? ((selectedNode.type as NodeType | undefined) ?? 'manual-trigger')
    : 'manual-trigger'
  const def = selectedNode ? getNodeDefinition(nodeType) : null
  const IconComponent = def ? ICON_MAP[def.icon] : null

  const configJson = selectedNode
    ? JSON.stringify(selectedNode.data.config ?? {}, null, 2)
    : '{}'

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
              style={{ color: def.color, flexShrink: 0 }}
            />
          )}
          <span className="text-muted-foreground flex-1 truncate text-sm font-medium">
            {def?.label ?? ''}
          </span>
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

          {/* Placeholder */}
          <div className="bg-muted/30 rounded border px-3 py-2.5">
            <p className="text-muted-foreground text-xs">
              Configuration for{' '}
              <span className="font-medium">{def?.label}</span> coming soon.
            </p>
          </div>

          {/* Config JSON */}
          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs font-medium">
              Current config
            </label>
            <pre className="bg-muted/40 overflow-x-auto rounded border p-2.5 text-xs">
              {configJson}
            </pre>
          </div>
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
