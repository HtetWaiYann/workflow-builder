import { create } from 'zustand'
import type { User, Workspace } from '@workflow-builder/shared'

export interface AuthState {
  user: User | null
  workspace: Workspace | null
  /** Starts as `true` so ProtectedRoute can show a loading gate before the initial /me check resolves. */
  isLoading: boolean
  setAuth: (user: User, workspace: Workspace | null) => void
  clearAuth: () => void
}

/** Zustand store for authenticated user and workspace. Initialises in a loading state until `useInitAuth` resolves. */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  workspace: null,
  isLoading: true,
  setAuth: (user, workspace) => set({ user, workspace, isLoading: false }),
  clearAuth: () => set({ user: null, workspace: null, isLoading: false }),
}))
