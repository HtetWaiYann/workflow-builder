import { create } from 'zustand'
import type { User, Workspace } from '@workflow-builder/shared'

interface AuthState {
  user: User | null
  workspace: Workspace | null
  isLoading: boolean
  setAuth: (user: User, workspace: Workspace | null) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  workspace: null,
  isLoading: true,
  setAuth: (user, workspace) => set({ user, workspace, isLoading: false }),
  clearAuth: () => set({ user: null, workspace: null, isLoading: false }),
}))
