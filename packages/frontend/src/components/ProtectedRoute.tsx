import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { LoadingScreen } from '@/components/LoadingScreen'

export interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * Renders children only when the user is authenticated.
 * Shows a loading spinner while auth is initializing (prevents a flash redirect on page refresh).
 * Redirects to `/login` if there is no authenticated user.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
