import type { ReactNode } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

interface PublicRouteProps {
  children: ReactNode
}

/**
 * Wraps public pages (login, register).
 * While auth is still initializing, renders nothing to avoid a flash redirect.
 * Once resolved, redirects authenticated users to the `redirect` search param
 * if present, otherwise to /dashboard. This ensures that invite links and other
 * redirect flows are honoured even when PublicRoute re-renders after login.
 */
export function PublicRoute({ children }: PublicRouteProps) {
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)
  const [searchParams] = useSearchParams()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    )
  }

  if (user) {
    const redirect = searchParams.get('redirect') ?? '/dashboard'
    return <Navigate to={redirect} replace />
  }

  return <>{children}</>
}
