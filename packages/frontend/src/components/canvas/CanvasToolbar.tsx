import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Play } from 'lucide-react'
import { useCanvasStore } from '@/stores/canvasStore'
import { Button } from '@/components/ui/button'

export function CanvasToolbar() {
  const navigate = useNavigate()
  const workflowName = useCanvasStore((s) => s.workflowName)
  const workflowStatus = useCanvasStore((s) => s.workflowStatus)
  const isDirty = useCanvasStore((s) => s.isDirty)
  const isSaving = useCanvasStore((s) => s.isSaving)
  const saveCanvas = useCanvasStore((s) => s.saveCanvas)
  const updateWorkflowName = useCanvasStore((s) => s.updateWorkflowName)
  const toggleWorkflowStatus = useCanvasStore((s) => s.toggleWorkflowStatus)

  // null = not editing; string = in-progress edit buffer
  const [editBuffer, setEditBuffer] = React.useState<string | null>(null)

  function startEditing() {
    setEditBuffer(workflowName)
  }

  function commitName() {
    if (editBuffer === null) return
    const trimmed = editBuffer.trim()
    if (trimmed && trimmed !== workflowName) {
      updateWorkflowName(trimmed).catch(() => {})
    }
    setEditBuffer(null)
  }

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commitName()
    if (e.key === 'Escape') setEditBuffer(null)
  }

  const statusLabel =
    workflowStatus === 'ACTIVE'
      ? 'Active'
      : workflowStatus === 'INACTIVE'
        ? 'Inactive'
        : 'Draft'

  const statusClass =
    workflowStatus === 'ACTIVE'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-muted text-muted-foreground'

  return (
    <div className="bg-background flex h-12 flex-shrink-0 items-center justify-between gap-2 border-b px-3">
      {/* Left */}
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 flex-shrink-0 p-0"
          onClick={() => navigate('/workflows')}
          aria-label="Back to workflows"
        >
          <ArrowLeft className="size-4" />
        </Button>

        {editBuffer !== null ? (
          <input
            autoFocus
            value={editBuffer}
            onChange={(e) => setEditBuffer(e.target.value)}
            onBlur={commitName}
            onKeyDown={handleNameKeyDown}
            className="border-border bg-background focus:ring-ring h-7 max-w-[240px] min-w-0 rounded border px-2 text-sm font-medium focus:ring-1 focus:outline-none"
          />
        ) : (
          <button
            onClick={startEditing}
            className="hover:bg-muted flex max-w-[240px] items-center gap-1.5 rounded px-1"
          >
            <span className="truncate text-sm font-medium">{workflowName}</span>
            {isDirty && (
              <span
                className="size-1.5 flex-shrink-0 rounded-full bg-amber-400"
                title="Unsaved changes"
              />
            )}
          </button>
        )}
      </div>

      {/* Center */}
      <div className="flex items-center justify-center">
        <button
          onClick={() => toggleWorkflowStatus().catch(() => {})}
          className={`rounded-full px-3 py-0.5 text-xs font-medium transition-colors ${statusClass}`}
        >
          {statusLabel}
        </button>
      </div>

      {/* Right */}
      <div className="flex flex-shrink-0 items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          disabled={!isDirty || isSaving}
          onClick={() => saveCanvas().catch(() => {})}
        >
          {isSaving ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Saving…
            </>
          ) : (
            'Save'
          )}
        </Button>

        <Button size="sm" className="h-8" disabled>
          <Play className="size-3.5" />
          Run
        </Button>
      </div>
    </div>
  )
}
