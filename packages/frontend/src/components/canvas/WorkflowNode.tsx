import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { NodeType, NodeRunStatus } from '@workflow-builder/shared'
import { ERROR_HANDLE_ID } from '@workflow-builder/shared'
import { getNodeDefinition, ICON_MAP } from '@/lib/nodeRegistry'
import { useExecutionStore } from '@/stores/executionStore'
import { WorkflowNodeCard } from '@/components/canvas/WorkflowNodeCard'

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
  const showErrorHandle =
    def.group !== 'Triggers' &&
    (props.data.errorConfig as { errorBranch?: boolean } | undefined)
      ?.errorBranch === true

  const statusBorderColor = nodeRun ? STATUS_BORDER_COLOR[nodeRun.status] : null
  const activeBorderColor = props.selected ? def.color : statusBorderColor

  return (
    <WorkflowNodeCard
      label={label}
      description={def.description}
      color={def.color}
      Icon={IconComponent}
      borderColor={activeBorderColor}
      statusDot={nodeRun ? STATUS_DOT[nodeRun.status] : undefined}
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

      {/* Error output handle — shown when errorBranch is enabled */}
      {showErrorHandle && (
        <Handle
          type="source"
          position={Position.Bottom}
          id={ERROR_HANDLE_ID}
          title="Error branch"
          className="!border-white dark:!border-zinc-900"
          style={{
            left: '50%',
            background: '#ef4444',
            width: 8,
            height: 8,
          }}
        />
      )}
    </WorkflowNodeCard>
  )
}
