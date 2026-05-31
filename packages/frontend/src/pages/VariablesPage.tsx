import * as React from 'react'
import { Plus, Trash2, Eye, EyeOff, AlertCircle, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import type { WorkspaceVariable } from '@workflow-builder/shared'
import { api } from '@/lib/api'
import { TopBar } from '@/components/TopBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const DRAWER_WIDTH = 360

type DrawerMode = 'add' | 'edit'

// ── Right-side form drawer ────────────────────────────────────────────────────

interface VariableDrawerProps {
  mode: DrawerMode | null
  editing: WorkspaceVariable | null
  onClose: () => void
  onCreate: (key: string, value: string) => Promise<void>
  onUpdate: (id: string, value: string) => Promise<void>
}

function VariableDrawer({
  mode,
  editing,
  onClose,
  onCreate,
  onUpdate,
}: VariableDrawerProps) {
  const [key, setKey] = React.useState('')
  const [value, setValue] = React.useState('')
  const [showValue, setShowValue] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  // Reset form whenever the drawer opens in a new mode
  React.useEffect(() => {
    setKey('')
    setValue('')
    setShowValue(false)
    setFormError(null)
    setIsSubmitting(false)
  }, [mode, editing?.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value) return
    setFormError(null)

    if (mode === 'add') {
      const trimmedKey = key.trim().toUpperCase()
      if (!trimmedKey) return
      if (!/^[A-Z0-9_]+$/.test(trimmedKey)) {
        setFormError(
          'Key must contain only uppercase letters, digits, and underscores.'
        )
        return
      }
      setIsSubmitting(true)
      try {
        await onCreate(trimmedKey, value)
        onClose()
      } catch (err) {
        setFormError(
          err instanceof Error ? err.message : 'Failed to create variable'
        )
        setIsSubmitting(false)
      }
    } else if (mode === 'edit' && editing) {
      setIsSubmitting(true)
      try {
        await onUpdate(editing.id, value)
        onClose()
      } catch (err) {
        setFormError(
          err instanceof Error ? err.message : 'Failed to update variable'
        )
        setIsSubmitting(false)
      }
    }
  }

  const open = mode !== null
  const title =
    mode === 'edit' ? `Update ${editing?.key ?? ''}` : 'Add Variable'

  return (
    <div
      className="flex-shrink-0 overflow-hidden border-l transition-all duration-200 ease-in-out"
      style={{ width: open ? DRAWER_WIDTH : 0 }}
    >
      <div className="flex h-full flex-col" style={{ width: DRAWER_WIDTH }}>
        {/* Header */}
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <span className="flex-1 text-sm font-medium">{title}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-3.5" />
          </Button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-5"
        >
          {mode === 'add' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="var-key">Key</Label>
              <Input
                id="var-key"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                placeholder="MY_API_KEY"
                disabled={isSubmitting}
                autoFocus={open && mode === 'add'}
              />
              <p className="text-muted-foreground text-xs">
                Reference in node configs as{' '}
                <code className="bg-muted rounded px-1">{`{{ $vars.${key || 'KEY'} }}`}</code>
              </p>
            </div>
          )}

          {mode === 'edit' && editing && (
            <div className="flex flex-col gap-1.5">
              <Label>Key</Label>
              <p className="text-sm font-medium">{editing.key}</p>
              <p className="text-muted-foreground text-xs">
                Reference as{' '}
                <code className="bg-muted rounded px-1">{`{{ $vars.${editing.key} }}`}</code>
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="var-value">
              {mode === 'edit' ? 'New Value' : 'Value'}
            </Label>
            <div className="relative">
              <Input
                id="var-value"
                type={showValue ? 'text' : 'password'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={
                  mode === 'edit' ? 'enter new secret value' : 'secret value'
                }
                disabled={isSubmitting}
                autoFocus={open && mode === 'edit'}
                className="pr-9"
              />
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
                onClick={() => setShowValue((v) => !v)}
                tabIndex={-1}
              >
                {showValue ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {mode === 'edit' && (
              <p className="text-muted-foreground text-xs">
                The previous value will be permanently replaced.
              </p>
            )}
          </div>

          {formError && <p className="text-destructive text-xs">{formError}</p>}

          {/* Footer actions pinned to the bottom */}
          <div className="mt-auto flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={
                isSubmitting || !value || (mode === 'add' && !key.trim())
              }
            >
              {isSubmitting ? 'Saving…' : mode === 'edit' ? 'Update' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Variables page ────────────────────────────────────────────────────────────

export function VariablesPage() {
  const [variables, setVariables] = React.useState<WorkspaceVariable[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [drawerMode, setDrawerMode] = React.useState<DrawerMode | null>(null)
  const [editingVariable, setEditingVariable] =
    React.useState<WorkspaceVariable | null>(null)

  React.useEffect(() => {
    api.variables
      .list()
      .then(({ variables: list }) => setVariables(list))
      .catch((err) =>
        setLoadError(
          err instanceof Error ? err.message : 'Failed to load variables'
        )
      )
      .finally(() => setIsLoading(false))
  }, [])

  function openAdd() {
    setEditingVariable(null)
    setDrawerMode('add')
  }

  function openEdit(variable: WorkspaceVariable) {
    setEditingVariable(variable)
    setDrawerMode('edit')
  }

  function closeDrawer() {
    setDrawerMode(null)
    setEditingVariable(null)
  }

  async function handleCreate(key: string, value: string) {
    const { variable } = await api.variables.create({ key, value })
    setVariables((prev) => [...prev, variable])
    toast.success(`Variable ${key} created`)
  }

  async function handleUpdate(id: string, value: string) {
    const { variable } = await api.variables.update(id, { value })
    setVariables((prev) => prev.map((v) => (v.id === id ? variable : v)))
    toast.success(`Variable ${variable.key} updated`)
  }

  async function handleDelete(variable: WorkspaceVariable) {
    try {
      await api.variables.delete(variable.id)
      setVariables((prev) => prev.filter((v) => v.id !== variable.id))
      if (editingVariable?.id === variable.id) closeDrawer()
      toast.success(`Variable ${variable.key} deleted`)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to delete variable'
      )
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Main content — shifts left when drawer opens */}
        <main className="flex-1 overflow-y-auto px-8 py-8">
          <div className="mx-auto w-full max-w-3xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <nav
                  aria-label="Breadcrumb"
                  className="text-muted-foreground mb-1 flex items-center gap-1.5 text-xs"
                >
                  <Link
                    to="/workflows"
                    className="hover:text-foreground transition-colors"
                  >
                    Workflows
                  </Link>
                  <span aria-hidden="true">/</span>
                  <span className="text-foreground">Workspace Variables</span>
                </nav>
                <h1 className="text-xl font-semibold">Workspace Variables</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  Store secrets and reference them in node configs as{' '}
                  <code className="bg-muted rounded px-1">
                    {'{{ $vars.KEY }}'}
                  </code>
                </p>
              </div>
              <Button onClick={openAdd}>
                <Plus />
                Add Variable
              </Button>
            </div>

            {isLoading && (
              <div className="text-muted-foreground py-24 text-center text-sm">
                Loading…
              </div>
            )}

            {!isLoading && loadError && (
              <div className="flex flex-col items-center gap-2 py-24">
                <AlertCircle className="text-destructive size-8" />
                <p className="text-sm font-medium">Failed to load variables</p>
                <p className="text-muted-foreground text-xs">{loadError}</p>
              </div>
            )}

            {!isLoading && !loadError && variables.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-24">
                <p className="text-sm font-medium">No variables yet</p>
                <p className="text-muted-foreground text-sm">
                  Add a variable to store secrets for use in your workflows.
                </p>
                <Button onClick={openAdd}>
                  <Plus />
                  Add Variable
                </Button>
              </div>
            )}

            {!isLoading && !loadError && variables.length > 0 && (
              <div className="border-border rounded-lg border">
                {variables.map((variable, i) => (
                  <div
                    key={variable.id}
                    className={`flex items-center gap-3 px-4 py-3 ${
                      i < variables.length - 1 ? 'border-border border-b' : ''
                    } ${editingVariable?.id === variable.id ? 'bg-muted/40' : ''}`}
                  >
                    <code className="flex-1 text-sm font-medium">
                      {variable.key}
                    </code>
                    <span className="text-muted-foreground text-xs">
                      {new Date(variable.updatedAt).toLocaleDateString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => openEdit(variable)}
                    >
                      Update
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive h-8 w-8 p-0"
                      onClick={() => handleDelete(variable)}
                      aria-label={`Delete ${variable.key}`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Right-side form drawer — pushes main content */}
        <VariableDrawer
          mode={drawerMode}
          editing={editingVariable}
          onClose={closeDrawer}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
        />
      </div>
    </div>
  )
}
