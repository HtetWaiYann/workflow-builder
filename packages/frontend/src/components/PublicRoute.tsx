import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

interface PublicRouteProps {
  children: ReactNode
}

/**
 * Wraps public pages (login, register).
 * While auth is still initializing, renders nothing to avoid a flash redirect.
 * Once resolved, redirects authenticated users to /dashboard.
 */
export function PublicRoute({ children }: PublicRouteProps) {
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
