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
import {
  LogOut,
  Settings,
  Check,
  ChevronDown,
  Plus,
  Variable,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

export function TopBar() {
  const user = useAuthStore((s) => s.user)
  const workspaces = useAuthStore((s) => s.workspaces)
  const currentWorkspace = useAuthStore((s) => s.currentWorkspace)
  const currentRole = useAuthStore((s) => s.currentRole)
  const switchWorkspace = useAuthStore((s) => s.switchWorkspace)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()

  const workspaceLetter = (currentWorkspace?.name ?? user?.email ?? 'W')
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

  function handleSwitchWorkspace(workspaceId: string) {
    switchWorkspace(workspaceId)
    navigate('/workflows')
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
      {/* Workspace switcher dropdown */}
      <DropdownMenuRoot>
        <DropdownMenuTrigger asChild>
          <button
            className="hover:bg-accent focus-visible:ring-ring flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            aria-label="Switch workspace"
          >
            <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md text-xs font-bold">
              {workspaceLetter}
            </div>
            <span className="text-sm font-medium">
              {currentWorkspace?.name ?? 'My Workspace'}
            </span>
            <ChevronDown className="text-muted-foreground size-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
            Workspaces
          </DropdownMenuLabel>
          {workspaces.map(({ workspace, role }) => (
            <DropdownMenuItem
              key={workspace.id}
              onSelect={() => handleSwitchWorkspace(workspace.id)}
            >
              <div className="bg-primary text-primary-foreground flex size-5 shrink-0 items-center justify-center rounded text-[10px] font-bold">
                {workspace.name.charAt(0).toUpperCase()}
              </div>
              <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
              <span className="text-muted-foreground text-xs">{role}</span>
              {workspace.id === currentWorkspace?.id && (
                <Check className="size-3.5" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => navigate('/workspaces/new')}>
            <Plus className="size-4" />
            New workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuRoot>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Theme dropdown */}
      <ThemeToggle />

      {/* User avatar dropdown */}
      <DropdownMenuRoot>
        <DropdownMenuTrigger asChild>
          <button className="bg-muted hover:bg-accent flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors focus:outline-none">
            {userInitial}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>{user?.name ?? user?.email}</DropdownMenuLabel>
          {currentRole && (
            <DropdownMenuLabel className="text-muted-foreground py-0 text-xs font-normal">
              {currentRole} · {currentWorkspace?.name}
            </DropdownMenuLabel>
          )}
          <DropdownMenuSeparator />
          {currentWorkspace && (
            <DropdownMenuItem
              onSelect={() =>
                navigate(`/workspaces/${currentWorkspace.id}/settings`)
              }
            >
              <Settings />
              Workspace Settings
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => navigate('/settings/variables')}>
            <Variable />
            Environment Variables
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
