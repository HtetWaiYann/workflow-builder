import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useCanvasStore } from '@/stores/canvasStore'
import { useAuthStore } from '@/stores/authStore'
import { useExecutionStore } from '@/stores/executionStore'
import { CanvasToolbar } from '@/components/canvas/CanvasToolbar'
import { NodePalette } from '@/components/canvas/NodePalette'
import { WorkflowCanvas } from '@/components/canvas/WorkflowCanvas'
import { ConfigPanel } from '@/components/canvas/ConfigPanel'
import { RunPanel } from '@/components/canvas/RunPanel'
import { HistoryPanel } from '@/components/panels/HistoryPanel'
import { Button } from '@/components/ui/button'
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

export function CanvasPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const isLoading = useCanvasStore((s) => s.isLoading)
  const error = useCanvasStore((s) => s.error)
  const accessDenied = useCanvasStore((s) => s.accessDenied)
  const loadWorkflow = useCanvasStore((s) => s.loadWorkflow)
  const reset = useCanvasStore((s) => s.reset)
  const undo = useCanvasStore((s) => s.undo)
  const redo = useCanvasStore((s) => s.redo)
  const nodes = useCanvasStore((s) => s.nodes)
  const workflowName = useCanvasStore((s) => s.workflowName)
  const resetExecution = useExecutionStore((s) => s.reset)
  const workspaces = useAuthStore((s) => s.workspaces)
  const switchWorkspace = useAuthStore((s) => s.switchWorkspace)

  const nodeLabelMap = Object.fromEntries(
    nodes.map((n) => [
      n.id,
      (n.data.label as string | undefined) ?? n.type ?? n.id,
    ])
  )

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

  function handleAccessDeniedOk() {
    const defaultWorkspace = workspaces[0]
    if (defaultWorkspace) {
      switchWorkspace(defaultWorkspace.workspace.id)
    }
    navigate('/workflows', { replace: true })
  }

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

      <HistoryPanel workflowName={workflowName} nodeLabelMap={nodeLabelMap} />

      <DialogRoot open={accessDenied}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Access Denied</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            You don&apos;t have access to this workflow. You will be switched
            back to your default workspace.
          </p>
          <DialogFooter>
            <Button className="w-full" onClick={handleAccessDeniedOk}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </div>
  )
}
