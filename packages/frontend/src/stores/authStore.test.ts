import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/stores/authStore'
import type { User, Workspace } from '@workflow-builder/shared'

const fakeUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: '2024-01-01T00:00:00.000Z',
}

const fakeWorkspace: Workspace = {
  id: 'ws-1',
  name: "Test User's Workspace",
  userId: 'user-1',
  createdAt: '2024-01-01T00:00:00.000Z',
}

beforeEach(() => {
  useAuthStore.setState({ user: null, workspace: null, isLoading: true })
})

// The store starts with no authenticated user and isLoading true, so the app
// shows a loading placeholder until the session check completes.
describe('initial state', () => {
  it('has null user and workspace with isLoading true', () => {
    const { user, workspace, isLoading } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(workspace).toBeNull()
    expect(isLoading).toBe(true)
  })
})

// Persists a successfully authenticated user and their workspace, and flips
// isLoading to false so the UI can render protected content.
describe('setAuth', () => {
  it('sets user and workspace and clears isLoading', () => {
    useAuthStore.getState().setAuth(fakeUser, fakeWorkspace)
    const { user, workspace, isLoading } = useAuthStore.getState()
    expect(user).toEqual(fakeUser)
    expect(workspace).toEqual(fakeWorkspace)
    expect(isLoading).toBe(false)
  })

  it('accepts null workspace', () => {
    useAuthStore.getState().setAuth(fakeUser, null)
    expect(useAuthStore.getState().workspace).toBeNull()
    expect(useAuthStore.getState().user).toEqual(fakeUser)
  })
})

// Wipes the authenticated session — called after logout or a failed /auth/me
// check — and flips isLoading to false so the app stops showing the placeholder.
describe('clearAuth', () => {
  it('clears user and workspace and sets isLoading false', () => {
    useAuthStore.getState().setAuth(fakeUser, fakeWorkspace)
    useAuthStore.getState().clearAuth()
    const { user, workspace, isLoading } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(workspace).toBeNull()
    expect(isLoading).toBe(false)
  })
})
