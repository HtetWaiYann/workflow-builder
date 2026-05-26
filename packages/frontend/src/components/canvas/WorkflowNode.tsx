import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { NodeType } from '@workflow-builder/shared'
import { getNodeDefinition, ICON_MAP } from '@/lib/nodeRegistry'

export function WorkflowNode(props: NodeProps) {
  const nodeType = (props.type as NodeType | undefined) ?? 'manual-trigger'
  const def = getNodeDefinition(nodeType)
  const label = (props.data.label as string | undefined) ?? def.label
  const IconComponent = ICON_MAP[def.icon]

  const inputCount = def.inputs.length
  const outputCount = def.outputs.length

  return (
    <div
      style={
        props.selected
          ? {
              border: `1.5px solid ${def.color}`,
              boxShadow: `0 0 0 3px ${def.color}22`,
            }
          : undefined
      }
      className="border-border bg-card relative w-[220px] overflow-hidden rounded-lg border select-none dark:border-zinc-700 dark:bg-zinc-900"
    >
      {/* Input handles */}
      {def.inputs.map((port, i) => (
        <Handle
          key={port.id}
          type="target"
          position={Position.Left}
          id={port.id}
          className="!border-card dark:!border-zinc-900"
          style={{
            top: `${((i + 1) / (inputCount + 1)) * 100}%`,
            background: def.color,
            width: 8,
            height: 8,
          }}
        />
      ))}

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {IconComponent && (
          <IconComponent
            size={14}
            style={{ color: def.color, flexShrink: 0 }}
          />
        )}
        <span className="flex-1 truncate text-sm leading-tight font-medium">
          {label}
        </span>
      </div>

      {/* Divider */}
      <div className="border-border border-t dark:border-zinc-700/80" />

      {/* Body */}
      <div className="px-3 py-2">
        <p className="text-muted-foreground truncate text-xs">
          {def.description}
        </p>
      </div>

      {/* Output handles */}
      {def.outputs.map((port, i) => (
        <Handle
          key={port.id}
          type="source"
          position={Position.Right}
          id={port.id}
          className="!border-card dark:!border-zinc-900"
          style={{
            top: `${((i + 1) / (outputCount + 1)) * 100}%`,
            background: def.color,
            width: 8,
            height: 8,
          }}
        />
      ))}
    </div>
  )
}
