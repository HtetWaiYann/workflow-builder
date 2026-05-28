import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useCanvasStore } from '@/stores/canvasStore'
import { useExecutionStore } from '@/stores/executionStore'
import { CanvasToolbar } from '@/components/canvas/CanvasToolbar'
import { NodePalette } from '@/components/canvas/NodePalette'
import { WorkflowCanvas } from '@/components/canvas/WorkflowCanvas'
import { ConfigPanel } from '@/components/canvas/ConfigPanel'
import { RunPanel } from '@/components/canvas/RunPanel'

export function CanvasPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const isLoading = useCanvasStore((s) => s.isLoading)
  const error = useCanvasStore((s) => s.error)
  const loadWorkflow = useCanvasStore((s) => s.loadWorkflow)
  const reset = useCanvasStore((s) => s.reset)
  const undo = useCanvasStore((s) => s.undo)
  const redo = useCanvasStore((s) => s.redo)
  const resetExecution = useExecutionStore((s) => s.reset)

  React.useEffect(() => {
    if (!id) {
      navigate('/workflows', { replace: true })
      return
    }
    reset()
    resetExecution()
    loadWorkflow(id)
    return () => {
      reset()
      resetExecution()
    }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Let inputs and textareas handle their own native undo
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      if (
        (e.metaKey || e.ctrlKey) &&
        (e.key === 'y' || (e.key === 'z' && e.shiftKey))
      ) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  React.useEffect(() => {
    if (!isLoading && error === 'WORKFLOW_NOT_FOUND') {
      toast.error('Workflow not found')
      navigate('/workflows', { replace: true })
    }
  }, [isLoading, error, navigate])

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <CanvasToolbar />

      {isLoading ? (
        <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
          Loading…
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            <NodePalette />
            <div className="flex-1 overflow-hidden">
              <WorkflowCanvas />
            </div>
            <ConfigPanel />
          </div>
          <RunPanel />
        </div>
      )}
    </div>
  )
}
