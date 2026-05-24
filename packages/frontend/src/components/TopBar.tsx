import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'
import { useNavigate } from 'react-router-dom'
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { LogOut, Settings } from 'lucide-react'

export function TopBar() {
  const user = useAuthStore((s) => s.user)
  const workspace = useAuthStore((s) => s.workspace)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()

  const workspaceLetter = (workspace?.name ?? user?.email ?? 'W')
    .charAt(0)
    .toUpperCase()

  const userInitial = (user?.name ?? user?.email ?? '?').charAt(0).toUpperCase()

  async function handleLogout() {
    try {
      await api.auth.logout()
    } catch {
      // proceed even if the request fails
    } finally {
      clearAuth()
      navigate('/login')
    }
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
      {/* Workspace badge */}
      <div className="flex items-center gap-2.5">
        <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md text-xs font-bold">
          {workspaceLetter}
        </div>
        <span className="text-sm font-medium">
          {workspace?.name ?? 'My Workspace'}
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User avatar dropdown */}
      <DropdownMenuRoot>
        <DropdownMenuTrigger asChild>
          <button className="bg-muted hover:bg-accent flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors focus:outline-none">
            {userInitial}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>{user?.name ?? user?.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Settings />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
            <LogOut />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuRoot>
    </header>
  )
}
