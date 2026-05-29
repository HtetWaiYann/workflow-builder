import type { WorkflowSummary } from '@workflow-builder/shared'
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  Play,
  Activity,
  Copy,
  Pencil,
  Trash2,
  Power,
  PowerOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkflowCardProps {
  workflow: WorkflowSummary
  onOpen: (id: string) => void
  onRename: (workflow: WorkflowSummary) => void
  onDuplicate: (id: string) => void
  onActivate: (id: string) => void
  onDeactivate: (id: string) => void
  onDelete: (id: string) => void
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  const weeks = Math.floor(days / 7)
  return `${weeks} week${weeks === 1 ? '' : 's'} ago`
}

export function WorkflowCard({
  workflow,
  onOpen,
  onRename,
  onDuplicate,
  onActivate,
  onDeactivate,
  onDelete,
}: WorkflowCardProps) {
  const isActive = workflow.status === 'ACTIVE'
  const isInactive = workflow.status === 'INACTIVE'

  return (
    <div
      className="bg-card hover:bg-accent/30 group flex cursor-pointer flex-col gap-3 rounded-lg border p-4 transition-colors"
      onClick={() => onOpen(workflow.id)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium">{workflow.name}</h3>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Last modified {formatRelativeTime(workflow.updatedAt)}
          </p>
        </div>

        {/* Kebab menu */}
        <DropdownMenuRoot>
          <DropdownMenuTrigger asChild>
            <button
              className="text-muted-foreground hover:text-foreground hover:bg-accent -mt-1 -mr-1 flex size-7 items-center justify-center rounded-md opacity-0 transition-all group-hover:opacity-100 focus:opacity-100 focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-44"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem onSelect={() => onOpen(workflow.id)}>
              <Play />
              Open
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onRename(workflow)}>
              <Pencil />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onDuplicate(workflow.id)}>
              <Copy />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isActive ? (
              <DropdownMenuItem onSelect={() => onDeactivate(workflow.id)}>
                <PowerOff />
                Deactivate
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => onActivate(workflow.id)}>
                <Power />
                Activate
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => onDelete(workflow.id)}
            >
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuRoot>
      </div>

      {/* Footer row */}
      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        {/* Status dot */}
        <span className="flex items-center gap-1.5">
          <span
            className={cn('size-1.5 rounded-full', {
              'bg-node-success': isActive,
              'bg-muted-foreground': isInactive,
              'bg-node-notify': !isActive && !isInactive, // DRAFT
            })}
          />
          <span className="capitalize">{workflow.status.toLowerCase()}</span>
        </span>

        {/* Divider */}
        <span className="bg-border h-3 w-px" />

        {/* Run count */}
        <span className="flex items-center gap-1">
          <Activity className="size-3.5" />
          {workflow.runCount} {workflow.runCount === 1 ? 'run' : 'runs'}
        </span>
      </div>
    </div>
  )
}
