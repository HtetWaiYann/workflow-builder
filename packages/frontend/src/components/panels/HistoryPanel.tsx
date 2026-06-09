import * as React from 'react'
import { ArrowLeft, ChevronDown, ChevronRight, Clock, X } from 'lucide-react'
import type {
  ExecutionNodeRun,
  ExecutionSummary,
  NodeRunStatus,
} from '@triggr/shared'
import { useExecutionStore } from '@/stores/executionStore'
import { Button } from '@/components/ui/button'

// ── Status display helpers ────────────────────────────────────────────────────

const EXEC_STATUS_CLASS: Record<string, string> = {
  PENDING: 'bg-muted text-muted-foreground',
  RUNNING:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  SUCCESS:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  ERROR: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  RUNNING: 'Running',
  SUCCESS: 'Success',
  ERROR: 'Error',
}

const NODE_STATUS_DOT: Record<NodeRunStatus, string> = {
  PENDING: 'bg-muted-foreground/40',
  RUNNING: 'bg-yellow-400 animate-pulse',
  SUCCESS: 'bg-green-500',
  ERROR: 'bg-red-500',
  SKIPPED: 'bg-muted-foreground/25',
}

function formatDuration(
  startedAt: string | null,
  finishedAt: string | null
): string | null {
  if (!startedAt) return null
  const start = new Date(startedAt).getTime()
  const end = finishedAt ? new Date(finishedAt).getTime() : Date.now()
  const ms = end - start
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

// ── History list row ──────────────────────────────────────────────────────────

interface HistoryRowProps {
  summary: ExecutionSummary
  onSelect: (id: string) => void
}

function HistoryRow({ summary, onSelect }: HistoryRowProps) {
  const statusClass =
    EXEC_STATUS_CLASS[summary.status] ?? EXEC_STATUS_CLASS['PENDING']
  const duration = formatDuration(summary.startedAt, summary.finishedAt)

  return (
    <button
      className="hover:bg-muted/50 flex w-full items-center gap-3 border-b px-4 py-3 text-left last:border-b-0"
      onClick={() => onSelect(summary.id)}
    >
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass}`}
      >
        {STATUS_LABEL[summary.status] ?? summary.status}
      </span>
      <span className="text-muted-foreground flex-1 truncate text-xs">
        {formatDateTime(summary.createdAt)}
      </span>
      {duration && (
        <span className="text-muted-foreground flex-shrink-0 text-xs">
          {duration}
        </span>
      )}
      <ChevronRight className="text-muted-foreground size-3.5 flex-shrink-0" />
    </button>
  )
}

// ── Node run row (detail view) ────────────────────────────────────────────────

interface HistoryNodeRunRowProps {
  run: ExecutionNodeRun
  nodeLabel: string
}

function HistoryNodeRunRow({ run, nodeLabel }: HistoryNodeRunRowProps) {
  const [expanded, setExpanded] = React.useState(false)
  const hasData = run.outputData !== null || run.error !== null

  return (
    <div className="border-border border-b last:border-b-0">
      <button
        className="hover:bg-muted/50 flex w-full items-center gap-2 px-4 py-2.5 text-left"
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
        <div className="bg-muted/30 space-y-2 px-4 pb-3">
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

// ── History panel ─────────────────────────────────────────────────────────────

/**
 * Right-side slide-in panel that displays the run history for a workflow.
 *
 * Renders in two modes:
 * - **List view** — ExecutionSummary rows showing status, datetime, and duration.
 *   Clicking a row drills into the detail view.
 * - **Detail view** — per-node breakdown of a single Execution, with expandable
 *   output and error data (same pattern as RunPanel's NodeRunRow).
 *
 * All visibility and data state is driven by executionStore. The panel is always
 * mounted (never conditionally removed) so the slide-out CSS transition plays
 * correctly on close.
 *
 * @param workflowName - Optional label shown in the panel header.
 * @param nodeLabelMap - Map of nodeId → display label for the detail view.
 *   Pass the canvas nodes map when rendering from CanvasPage. Omit on the
 *   dashboard — raw node IDs will be shown as fallback labels.
 */
export function HistoryPanel({
  workflowName,
  nodeLabelMap = {},
}: {
  workflowName?: string
  nodeLabelMap?: Record<string, string>
}) {
  const showHistoryPanel = useExecutionStore((s) => s.showHistoryPanel)
  const recentExecutions = useExecutionStore((s) => s.recentExecutions)
  const historyExecution = useExecutionStore((s) => s.historyExecution)
  const isLoadingHistoryDetail = useExecutionStore(
    (s) => s.isLoadingHistoryDetail
  )
  const closeHistoryPanel = useExecutionStore((s) => s.closeHistoryPanel)
  const selectHistoryExecution = useExecutionStore(
    (s) => s.selectHistoryExecution
  )
  const backToHistoryList = useExecutionStore((s) => s.backToHistoryList)

  const isDetailView = historyExecution !== null

  const headerTitle = isDetailView
    ? 'Run Details'
    : workflowName
      ? `Run History — ${workflowName}`
      : 'Run History'

  return (
    <>
      {/* Backdrop — closes panel on click */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          showHistoryPanel
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
        onClick={closeHistoryPanel}
        aria-hidden="true"
      />

      {/* Slide-in panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Run history"
        className={`bg-background fixed inset-y-0 right-0 z-50 flex w-96 flex-col border-l shadow-xl transition-transform duration-300 ease-in-out ${
          showHistoryPanel ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center gap-2 border-b px-4 py-3">
          {isDetailView && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={backToHistoryList}
              aria-label="Back to history list"
            >
              <ArrowLeft className="size-3.5" />
            </Button>
          )}
          <Clock className="text-muted-foreground size-4 flex-shrink-0" />
          <span className="flex-1 truncate text-sm font-medium">
            {headerTitle}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={closeHistoryPanel}
            aria-label="Close history panel"
          >
            <X className="size-3.5" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Loading detail */}
          {isLoadingHistoryDetail && (
            <div className="text-muted-foreground flex items-center justify-center py-8 text-sm">
              Loading…
            </div>
          )}

          {/* Detail view */}
          {isDetailView && !isLoadingHistoryDetail && (
            <>
              {/* Execution-level summary */}
              <div className="flex items-center gap-2 border-b px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${EXEC_STATUS_CLASS[historyExecution.status] ?? EXEC_STATUS_CLASS['PENDING']}`}
                >
                  {STATUS_LABEL[historyExecution.status] ??
                    historyExecution.status}
                </span>
                <span className="text-muted-foreground text-xs">
                  {historyExecution.startedAt
                    ? formatDateTime(historyExecution.startedAt)
                    : '—'}
                </span>
                <span className="text-muted-foreground text-xs">
                  {formatDuration(
                    historyExecution.startedAt,
                    historyExecution.finishedAt
                  )}
                </span>
              </div>

              {historyExecution.nodeRuns.length === 0 ? (
                <div className="text-muted-foreground flex items-center justify-center py-8 text-sm">
                  No nodes ran.
                </div>
              ) : (
                historyExecution.nodeRuns.map((run) => (
                  <HistoryNodeRunRow
                    key={run.id}
                    run={run}
                    nodeLabel={nodeLabelMap[run.nodeId] ?? run.nodeId}
                  />
                ))
              )}
            </>
          )}

          {/* List view */}
          {!isDetailView && !isLoadingHistoryDetail && (
            <>
              {recentExecutions.length === 0 ? (
                <div className="text-muted-foreground flex items-center justify-center py-8 text-sm">
                  No runs yet.
                </div>
              ) : (
                recentExecutions.map((summary) => (
                  <HistoryRow
                    key={summary.id}
                    summary={summary}
                    onSelect={selectHistoryExecution}
                  />
                ))
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
