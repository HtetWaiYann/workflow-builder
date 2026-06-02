import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'

/**
 * Bootstraps auth state on app mount by calling `GET /auth/me`.
 * Populates the auth store on success; clears it if the request fails (e.g. no session).
 * Must be called once at the router root so the loading gate in ProtectedRoute resolves correctly.
 */
export function useInitAuth() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  useEffect(() => {
    api.auth
      .me()
      .then(({ user, workspaces }) => setAuth(user, workspaces))
      .catch(() => clearAuth())
  }, [setAuth, clearAuth])
}
