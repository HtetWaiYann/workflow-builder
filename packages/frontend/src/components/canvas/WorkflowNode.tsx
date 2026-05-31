import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { NodeType, NodeRunStatus } from '@workflow-builder/shared'
import { getNodeDefinition, ICON_MAP } from '@/lib/nodeRegistry'
import { useExecutionStore } from '@/stores/executionStore'

const STATUS_DOT: Record<NodeRunStatus, string> = {
  PENDING: 'bg-muted-foreground/40',
  RUNNING: 'bg-yellow-400 animate-pulse',
  SUCCESS: 'bg-green-500',
  ERROR: 'bg-red-500',
  SKIPPED: 'bg-muted-foreground/25',
}

const STATUS_BORDER_COLOR: Record<NodeRunStatus, string | null> = {
  PENDING: null,
  RUNNING: '#facc1599',
  SUCCESS: '#22c55e99',
  ERROR: '#ef444499',
  SKIPPED: null,
}

export function WorkflowNode(props: NodeProps) {
  const nodeType = (props.type as NodeType | undefined) ?? 'manual-trigger'
  const def = getNodeDefinition(nodeType)
  const label = (props.data.label as string | undefined) ?? def.label
  const IconComponent = ICON_MAP[def.icon]
  const nodeRun = useExecutionStore((s) =>
    s.currentExecution?.nodeRuns.find((r) => r.nodeId === props.id)
  )

  const inputCount = def.inputs.length
  const outputCount = def.outputs.length

  const statusBorderColor = nodeRun ? STATUS_BORDER_COLOR[nodeRun.status] : null
  const activeBorderColor = props.selected ? def.color : statusBorderColor

  return (
    <div
      style={
        activeBorderColor
          ? {
              border: `1.5px solid ${activeBorderColor}`,
              boxShadow: `0 0 0 3px ${activeBorderColor}22`,
            }
          : undefined
      }
      className="relative w-[220px] overflow-hidden rounded-lg border border-zinc-200 bg-white select-none dark:border-zinc-700 dark:bg-zinc-900"
    >
      {/* Input handles */}
      {def.inputs.map((port, i) => (
        <Handle
          key={port.id}
          type="target"
          position={Position.Left}
          id={port.id}
          className="!border-white dark:!border-zinc-900"
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
        {nodeRun && (
          <span
            className={`size-2 flex-shrink-0 rounded-full ${STATUS_DOT[nodeRun.status]}`}
            title={nodeRun.status}
          />
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-200 dark:border-zinc-700/80" />

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
          className="!border-white dark:!border-zinc-900"
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
