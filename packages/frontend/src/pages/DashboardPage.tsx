import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const workspace = useAuthStore((s) => s.workspace)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()

  async function handleLogout() {
    await api.auth.logout().catch(() => null)
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">
        Welcome, {user?.name ?? user?.email}
      </h1>
      {workspace && (
        <p className="text-muted-foreground text-sm">
          Workspace: {workspace.name}
        </p>
      )}
      <Button variant="outline" onClick={handleLogout}>
        Log out
      </Button>
    </div>
  )
}
