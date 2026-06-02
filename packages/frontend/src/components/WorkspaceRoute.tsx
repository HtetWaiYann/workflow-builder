import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export interface WorkspaceRouteProps {
  children: ReactNode
}

/**
 * Extends ProtectedRoute to also require an active workspace.
 * Authenticated users without any workspace are redirected to /workspaces/new
 * so they can create one before accessing workspace-scoped pages.
 * Must be used instead of ProtectedRoute for any page that calls workspace-scoped APIs.
 */
export function WorkspaceRoute({ children }: WorkspaceRouteProps) {
  const currentWorkspace = useAuthStore((s) => s.currentWorkspace)

  return (
    <ProtectedRoute>
      {currentWorkspace ? children : <Navigate to="/workspaces/new" replace />}
    </ProtectedRoute>
  )
}
