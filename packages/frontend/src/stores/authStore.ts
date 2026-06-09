import { create } from 'zustand'
import type {
  User,
  Workspace,
  WorkspaceMembership,
  WorkspaceMemberRole,
} from '@triggr/shared'

export interface AuthState {
  user: User | null
  workspaces: WorkspaceMembership[]
  currentWorkspace: Workspace | null
  currentRole: WorkspaceMemberRole | null
  /** Starts as `true` so ProtectedRoute can show a loading gate before the initial /me check resolves. */
  isLoading: boolean
  setAuth: (user: User, workspaces: WorkspaceMembership[]) => void
  clearAuth: () => void
  /** Switches the active workspace and updates currentRole accordingly. */
  switchWorkspace: (workspaceId: string) => void
  /** Updates the display name of the current workspace in both currentWorkspace and workspaces[]. */
  updateCurrentWorkspaceName: (name: string) => void
}

/** Zustand store for authenticated user and workspace memberships. Initialises in a loading state until `useInitAuth` resolves. */
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  workspaces: [],
  currentWorkspace: null,
  currentRole: null,
  isLoading: true,
  setAuth: (user, workspaces) => {
    const first = workspaces[0]
    set({
      user,
      workspaces,
      currentWorkspace: first?.workspace ?? null,
      currentRole: first?.role ?? null,
      isLoading: false,
    })
  },
  clearAuth: () =>
    set({
      user: null,
      workspaces: [],
      currentWorkspace: null,
      currentRole: null,
      isLoading: false,
    }),
  switchWorkspace: (workspaceId) => {
    const found = get().workspaces.find((m) => m.workspace.id === workspaceId)
    if (found) {
      set({ currentWorkspace: found.workspace, currentRole: found.role })
    }
  },
  updateCurrentWorkspaceName: (name) => {
    const currentId = get().currentWorkspace?.id
    if (!currentId) return
    set((state) => ({
      currentWorkspace: state.currentWorkspace
        ? { ...state.currentWorkspace, name }
        : null,
      workspaces: state.workspaces.map((m) =>
        m.workspace.id === currentId
          ? { ...m, workspace: { ...m.workspace, name } }
          : m
      ),
    }))
  },
}))
