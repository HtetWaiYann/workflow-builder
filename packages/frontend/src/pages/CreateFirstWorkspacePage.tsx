import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

export function CreateFirstWorkspacePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const workspaces = useAuthStore((s) => s.workspaces)
  const setAuth = useAuthStore((s) => s.setAuth)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const hasExistingWorkspace = workspaces.length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    setError(null)
    try {
      const { workspace, role } = await api.workspaces.create({
        name: name.trim(),
      })
      if (user) {
        setAuth(user, [...workspaces, { workspace, role }])
      }
      navigate('/workflows', { replace: true })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create workspace'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          {hasExistingWorkspace && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1.5 text-sm transition-colors"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>
          )}
          <CardTitle>Create a workspace</CardTitle>
          <CardDescription>
            A workspace is where your workflows and team live.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <CardContent className="flex flex-col gap-4">
            {error && (
              <p
                role="alert"
                aria-live="polite"
                className="text-destructive text-sm"
              >
                {error}
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="workspace-name">Workspace name</Label>
              <Input
                id="workspace-name"
                placeholder="Acme Corp"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? 'Creating…' : 'Create workspace'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
