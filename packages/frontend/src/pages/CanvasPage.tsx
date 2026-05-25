import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useCanvasStore } from '@/stores/canvasStore'
import { CanvasToolbar } from '@/components/canvas/CanvasToolbar'
import { NodePalette } from '@/components/canvas/NodePalette'
import { WorkflowCanvas } from '@/components/canvas/WorkflowCanvas'
import { ConfigPanel } from '@/components/canvas/ConfigPanel'

export function CanvasPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const isLoading = useCanvasStore((s) => s.isLoading)
  const error = useCanvasStore((s) => s.error)
  const loadWorkflow = useCanvasStore((s) => s.loadWorkflow)
  const reset = useCanvasStore((s) => s.reset)

  React.useEffect(() => {
    if (!id) {
      navigate('/workflows', { replace: true })
      return
    }
    reset()
    loadWorkflow(id)
    return () => reset()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

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
        <div className="flex flex-1 overflow-hidden">
          <NodePalette />
          <div className="flex-1 overflow-hidden">
            <WorkflowCanvas />
          </div>
          <ConfigPanel />
        </div>
      )}
    </div>
  )
}
