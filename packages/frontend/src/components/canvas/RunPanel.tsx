import * as React from 'react'
import { ChevronDown, X } from 'lucide-react'
import type { ExecutionNodeRun, NodeRunStatus } from '@triggr/shared'
import { useExecutionStore } from '@/stores/executionStore'
import { useCanvasStore } from '@/stores/canvasStore'
import { Button } from '@/components/ui/button'

// ── Status badge helpers ──────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  RUNNING: 'Running',
  SUCCESS: 'Success',
  ERROR: 'Error',
}

const EXEC_STATUS_CLASS: Record<string, string> = {
  PENDING: 'bg-muted text-muted-foreground',
  RUNNING:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  SUCCESS:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  ERROR: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

const NODE_STATUS_DOT: Record<NodeRunStatus, string> = {
  PENDING: 'bg-muted-foreground/40',
  RUNNING: 'bg-yellow-400 animate-pulse',
  SUCCESS: 'bg-green-500',
  ERROR: 'bg-red-500',
  SKIPPED: 'bg-muted-foreground/25',
}

function formatDuration(startedAt: string | null, finishedAt: string | null) {
  if (!startedAt) return null
  const start = new Date(startedAt).getTime()
  const end = finishedAt ? new Date(finishedAt).getTime() : Date.now()
  const ms = end - start
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

// ── Node run row ──────────────────────────────────────────────────────────────

interface NodeRunRowProps {
  run: ExecutionNodeRun
  nodeLabel: string
}

function NodeRunRow({ run, nodeLabel }: NodeRunRowProps) {
  const [expanded, setExpanded] = React.useState(false)
  const hasData = run.outputData !== null || run.error !== null

  return (
    <div className="border-border border-b last:border-b-0">
      <button
        className="hover:bg-muted/50 flex w-full items-center gap-2 px-3 py-2 text-left"
        onClick={() => hasData && setExpanded((v) => !v)}
        disabled={!hasData}
      >
        <span
          className={`size-2 flex-shrink-0 rounded-full ${NODE_STATUS_DOT[run.status]}`}
        />
        <span className="flex-1 truncate text-sm">{nodeLabel}</span>
        <span className="text-muted-foreground text-xs">
          {formatDuration(run.startedAt, run.finishedAt)}
        </span>
        {hasData && (
          <ChevronDown
            className={`text-muted-foreground size-3.5 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {expanded && (
        <div className="bg-muted/30 space-y-2 px-3 pb-3">
          {run.error && (
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium">
                Error
              </p>
              <pre className="overflow-x-auto rounded bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {run.error}
              </pre>
            </div>
          )}
          {run.outputData && (
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium">
                Output
              </p>
              <pre className="bg-muted overflow-x-auto rounded p-2 text-xs">
                {JSON.stringify(run.outputData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Run panel ─────────────────────────────────────────────────────────────────

/**
 * Bottom sliding panel that shows the status of the most recent execution.
 * Renders nothing when showRunPanel is false.
 */
export function RunPanel() {
  const currentExecution = useExecutionStore((s) => s.currentExecution)
  const isTriggering = useExecutionStore((s) => s.isTriggering)
  const showRunPanel = useExecutionStore((s) => s.showRunPanel)
  const closeRunPanel = useExecutionStore((s) => s.closeRunPanel)
  const nodes = useCanvasStore((s) => s.nodes)

  if (!showRunPanel) return null

  const nodeLabelMap = Object.fromEntries(
    nodes.map((n) => [
      n.id,
      (n.data.label as string | undefined) ?? n.type ?? n.id,
    ])
  )

  const exec = currentExecution
  const statusClass = exec
    ? (EXEC_STATUS_CLASS[exec.status] ?? EXEC_STATUS_CLASS['PENDING'])
    : EXEC_STATUS_CLASS['PENDING']

  return (
    <div
      className="border-border bg-background flex flex-col border-t"
      style={{ height: 280 }}
    >
      {/* Header */}
      <div className="flex flex-shrink-0 items-center gap-2 border-b px-3 py-2">
        <span className="text-sm font-medium">Run Results</span>
        {isTriggering && (
          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
            Starting…
          </span>
        )}
        {exec && !isTriggering && (
          <>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass}`}
            >
              {STATUS_LABEL[exec.status] ?? exec.status}
            </span>
            <span className="text-muted-foreground text-xs">
              {formatDuration(exec.startedAt, exec.finishedAt)}
            </span>
          </>
        )}
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={closeRunPanel}
          aria-label="Close run panel"
        >
          <X className="size-3.5" />
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {isTriggering && !exec && (
          <div className="text-muted-foreground flex items-center justify-center py-8 text-sm">
            Triggering run…
          </div>
        )}
        {exec && exec.nodeRuns.length === 0 && (
          <div className="text-muted-foreground flex items-center justify-center py-8 text-sm">
            No nodes in this workflow.
          </div>
        )}
        {exec &&
          exec.nodeRuns.length > 0 &&
          exec.nodeRuns.map((run) => (
            <NodeRunRow
              key={run.id}
              run={run}
              nodeLabel={nodeLabelMap[run.nodeId] ?? run.nodeId}
            />
          ))}
      </div>
    </div>
  )
}
