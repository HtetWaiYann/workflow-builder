import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'

export function useInitAuth() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  useEffect(() => {
    api.auth
      .me()
      .then(({ user, workspace }) => setAuth(user, workspace))
      .catch(() => clearAuth())
  }, [setAuth, clearAuth])
}
