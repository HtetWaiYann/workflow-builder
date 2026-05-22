import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useInitAuth } from '@/hooks/useInitAuth'
import { useAuthStore } from '@/stores/authStore'
import type { AuthResponse } from '@workflow-builder/shared'

vi.mock('@/lib/api', () => ({
  api: {
    auth: {
      me: vi.fn(),
    },
  },
}))

import { api } from '@/lib/api'
const mockMe = vi.mocked(api.auth.me)

const fakeResponse: AuthResponse = {
  user: {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  workspace: {
    id: 'ws-1',
    name: "Test's Workspace",
    userId: 'user-1',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({ user: null, workspace: null, isLoading: true })
})

// Fires once on mount to restore an existing session via /auth/me. Writes the
// result into the auth store so the rest of the app reads auth state synchronously.
describe('useInitAuth', () => {
  it('calls setAuth when /auth/me resolves', async () => {
    mockMe.mockResolvedValueOnce(fakeResponse)
    renderHook(() => useInitAuth())

    await waitFor(() => {
      expect(useAuthStore.getState().user).toEqual(fakeResponse.user)
      expect(useAuthStore.getState().workspace).toEqual(fakeResponse.workspace)
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })

  it('calls clearAuth when /auth/me rejects', async () => {
    mockMe.mockRejectedValueOnce(new Error('Unauthorized'))
    renderHook(() => useInitAuth())

    await waitFor(() => {
      expect(useAuthStore.getState().user).toBeNull()
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })
})
