import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, LayoutGrid, AlertCircle } from 'lucide-react'
import type { WorkflowSummary } from '@workflow-builder/shared'
import { useWorkflowStore } from '@/stores/workflowStore'
import { api } from '@/lib/api'
import { TopBar } from '@/components/TopBar'
import { WorkflowCard } from '@/components/workflows/WorkflowCard'
import { NewWorkflowDialog } from '@/components/workflows/NewWorkflowDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function DashboardPage() {
  const navigate = useNavigate()
  const {
    workflows,
    isLoading,
    error,
    setWorkflows,
    addWorkflow,
    updateWorkflow,
    removeWorkflow,
    setLoading,
    setError,
  } = useWorkflowStore()

  const [search, setSearch] = React.useState('')
  const [newDialogOpen, setNewDialogOpen] = React.useState(false)

  // Fetch workflow list on mount
  React.useEffect(() => {
    setLoading(true)
    api.workflows
      .list()
      .then(({ workflows: list }) => setWorkflows(list))
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : 'Failed to load workflows'
        )
      )
  }, [setWorkflows, setLoading, setError])

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return workflows
    return workflows.filter((w) => w.name.toLowerCase().includes(q))
  }, [workflows, search])

  async function handleCreate(name: string) {
    const { workflow } = await api.workflows.create({ name })
    addWorkflow(workflow)
    navigate(`/workflows/${workflow.id}`)
  }

  async function handleDuplicate(id: string) {
    const { workflow } = await api.workflows.duplicate(id)
    addWorkflow(workflow)
  }

  async function handleActivate(id: string) {
    const { workflow } = await api.workflows.activate(id)
    updateWorkflow(workflow)
  }

  async function handleDeactivate(id: string) {
    const { workflow } = await api.workflows.deactivate(id)
    updateWorkflow(workflow)
  }

  async function handleDelete(id: string) {
    await api.workflows.delete(id)
    removeWorkflow(id)
  }

  const [renamingWorkflow, setRenamingWorkflow] =
    React.useState<WorkflowSummary | null>(null)

  return (
    <div className="flex h-screen flex-col">
      <TopBar />

      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto w-full max-w-6xl">
          {/* Page header */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-semibold">Workflows</h1>
            <Button onClick={() => setNewDialogOpen(true)}>
              <Plus />
              New Workflow
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              className="pl-9"
              placeholder="Search workflows…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* States */}
          {isLoading && (
            <div className="text-muted-foreground flex items-center justify-center py-24 text-sm">
              Loading…
            </div>
          )}

          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center gap-2 py-24">
              <AlertCircle className="text-destructive size-8" />
              <p className="text-sm font-medium">Failed to load workflows</p>
              <p className="text-muted-foreground text-xs">{error}</p>
            </div>
          )}

          {!isLoading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
              <LayoutGrid className="text-muted-foreground size-10" />
              {search ? (
                <p className="text-muted-foreground text-sm">
                  No workflows match &ldquo;{search}&rdquo;
                </p>
              ) : (
                <>
                  <p className="text-sm font-medium">No workflows yet</p>
                  <p className="text-muted-foreground text-sm">
                    Create your first workflow to get started.
                  </p>
                  <Button
                    className="mt-1"
                    onClick={() => setNewDialogOpen(true)}
                  >
                    <Plus />
                    New Workflow
                  </Button>
                </>
              )}
            </div>
          )}

          {!isLoading && !error && filtered.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  onOpen={(id) => navigate(`/workflows/${id}`)}
                  onRename={setRenamingWorkflow}
                  onDuplicate={handleDuplicate}
                  onActivate={handleActivate}
                  onDeactivate={handleDeactivate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <NewWorkflowDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        onSubmit={handleCreate}
      />

      {/* Rename dialog — inline since it reuses the same modal shell */}
      {renamingWorkflow && (
        <RenameDialog
          workflow={renamingWorkflow}
          onClose={() => setRenamingWorkflow(null)}
          onSubmit={async (name) => {
            const { workflow } = await api.workflows.rename(
              renamingWorkflow.id,
              { name }
            )
            updateWorkflow(workflow)
            setRenamingWorkflow(null)
          }}
        />
      )}
    </div>
  )
}

// ── Rename dialog ─────────────────────────────────────────────────────────────

import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

interface RenameDialogProps {
  workflow: WorkflowSummary
  onClose: () => void
  onSubmit: (name: string) => Promise<void>
}

function RenameDialog({ workflow, onClose, onSubmit }: RenameDialogProps) {
  const [name, setName] = React.useState(workflow.name)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [renameError, setRenameError] = React.useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setIsSubmitting(true)
    setRenameError(null)
    try {
      await onSubmit(trimmed)
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : 'Failed to rename')
      setIsSubmitting(false)
    }
  }

  return (
    <DialogRoot open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename Workflow</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rename-input">Name</Label>
            <Input
              id="rename-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              disabled={isSubmitting}
            />
            {renameError && (
              <p className="text-destructive text-xs">{renameError}</p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}
