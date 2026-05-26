import * as React from 'react'
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface NewWorkflowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (name: string) => Promise<void>
}

export function NewWorkflowDialog({
  open,
  onOpenChange,
  onSubmit,
}: NewWorkflowDialogProps) {
  const [name, setName] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  function handleOpenChange(next: boolean) {
    if (!isSubmitting) {
      onOpenChange(next)
      if (!next) {
        setName('')
        setError(null)
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Workflow name is required')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      await onSubmit(trimmed)
      onOpenChange(false)
      setName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workflow')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DialogRoot open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New Workflow</DialogTitle>
          <DialogDescription>
            Give your workflow a name to get started.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="workflow-name">Name</Label>
            <Input
              id="workflow-name"
              placeholder="e.g. Weekly Newsletter"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              disabled={isSubmitting}
            />
            {error && <p className="text-destructive text-xs">{error}</p>}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}
