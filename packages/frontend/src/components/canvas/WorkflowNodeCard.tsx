import type { ComponentType, CSSProperties, ReactNode } from 'react'

type IconComponent = ComponentType<{
  size?: number
  style?: CSSProperties
  className?: string
}>

interface WorkflowNodeCardProps {
  label: string
  description: string
  color: string
  Icon?: IconComponent
  /** Applies the colored border + outer glow — mirrors the selected/running state. */
  borderColor?: string | null
  /** Optional status indicator dot rendered in the header (e.g. running, success, error). */
  statusDot?: string
  inputHandle?: boolean
  outputHandle?: boolean
  /** React Flow Handle components passed by WorkflowNode; rendered inside the container. */
  children?: ReactNode
}

/**
 * Pure-visual replica of the WorkflowNode card, usable outside React Flow context.
 * WorkflowNode wraps this with React Flow Handles via children; static contexts use
 * inputHandle/outputHandle props instead.
 */
export function WorkflowNodeCard({
  label,
  description,
  color,
  Icon,
  borderColor,
  statusDot,
  inputHandle,
  outputHandle,
  children,
}: WorkflowNodeCardProps) {
  return (
    <div
      style={
        borderColor
          ? {
              border: `1.5px solid ${borderColor}`,
              boxShadow: `0 0 0 3px ${borderColor}22`,
            }
          : undefined
      }
      className="relative w-[220px] overflow-hidden rounded-lg border border-zinc-200 bg-white select-none dark:border-zinc-700 dark:bg-zinc-900"
    >
      {inputHandle && (
        <div
          className="absolute top-1/2 -left-[4px] z-10 h-2 w-2 -translate-y-1/2 rounded-full border-2 border-white dark:border-zinc-900"
          style={{ background: color }}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {Icon && <Icon size={14} style={{ color, flexShrink: 0 }} />}
        <span className="flex-1 truncate text-sm leading-tight font-medium">
          {label}
        </span>
        {statusDot && (
          <span className={`size-2 shrink-0 rounded-full ${statusDot}`} />
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-200 dark:border-zinc-700/80" />

      {/* Body */}
      <div className="px-3 py-2">
        <p className="text-muted-foreground truncate text-xs">{description}</p>
      </div>

      {outputHandle && (
        <div
          className="absolute top-1/2 -right-[4px] z-10 h-2 w-2 -translate-y-1/2 rounded-full border-2 border-white dark:border-zinc-900"
          style={{ background: color }}
        />
      )}

      {/* React Flow Handles injected by WorkflowNode */}
      {children}
    </div>
  )
}
