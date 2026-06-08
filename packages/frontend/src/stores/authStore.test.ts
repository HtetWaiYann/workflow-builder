import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/stores/authStore'
import type {
  User,
  Workspace,
  WorkspaceMembership,
} from '@triggr/shared'

const fakeUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: '2024-01-01T00:00:00.000Z',
}

const fakeWorkspace: Workspace = {
  id: 'ws-1',
  name: "Test User's Workspace",
  createdAt: '2024-01-01T00:00:00.000Z',
}

const fakeMembership: WorkspaceMembership = {
  workspace: fakeWorkspace,
  role: 'OWNER',
}

beforeEach(() => {
  useAuthStore.setState({
    user: null,
    workspaces: [],
    currentWorkspace: null,
    currentRole: null,
    isLoading: true,
  })
})

// The store starts with no authenticated user and isLoading true, so the app
// shows a loading placeholder until the session check completes.
describe('initial state', () => {
  it('has null user and workspace with isLoading true', () => {
    const { user, currentWorkspace, isLoading } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(currentWorkspace).toBeNull()
    expect(isLoading).toBe(true)
  })
})

// Persists a successfully authenticated user and their first workspace, and flips
// isLoading to false so the UI can render protected content.
describe('setAuth', () => {
  it('sets user and currentWorkspace/currentRole from the first membership', () => {
    useAuthStore.getState().setAuth(fakeUser, [fakeMembership])
    const { user, currentWorkspace, currentRole, isLoading } =
      useAuthStore.getState()
    expect(user).toEqual(fakeUser)
    expect(currentWorkspace).toEqual(fakeWorkspace)
    expect(currentRole).toBe('OWNER')
    expect(isLoading).toBe(false)
  })

  it('sets currentWorkspace to null when workspaces array is empty', () => {
    useAuthStore.getState().setAuth(fakeUser, [])
    expect(useAuthStore.getState().currentWorkspace).toBeNull()
    expect(useAuthStore.getState().currentRole).toBeNull()
    expect(useAuthStore.getState().user).toEqual(fakeUser)
  })
})

// Wipes the authenticated session — called after logout or a failed /auth/me
// check — and flips isLoading to false so the app stops showing the placeholder.
describe('clearAuth', () => {
  it('clears user and workspace and sets isLoading false', () => {
    useAuthStore.getState().setAuth(fakeUser, [fakeMembership])
    useAuthStore.getState().clearAuth()
    const { user, currentWorkspace, isLoading } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(currentWorkspace).toBeNull()
    expect(isLoading).toBe(false)
  })
})

// Switches the active workspace without refetching from the server.
describe('switchWorkspace', () => {
  it('updates currentWorkspace and currentRole when the workspace exists', () => {
    const secondWorkspace: Workspace = {
      id: 'ws-2',
      name: 'Second Workspace',
      createdAt: '2024-01-01T00:00:00.000Z',
    }
    const secondMembership: WorkspaceMembership = {
      workspace: secondWorkspace,
      role: 'EDITOR',
    }
    useAuthStore
      .getState()
      .setAuth(fakeUser, [fakeMembership, secondMembership])
    useAuthStore.getState().switchWorkspace('ws-2')
    expect(useAuthStore.getState().currentWorkspace).toEqual(secondWorkspace)
    expect(useAuthStore.getState().currentRole).toBe('EDITOR')
  })

  it('does nothing when the workspaceId is not found', () => {
    useAuthStore.getState().setAuth(fakeUser, [fakeMembership])
    useAuthStore.getState().switchWorkspace('unknown-id')
    expect(useAuthStore.getState().currentWorkspace).toEqual(fakeWorkspace)
  })
})
