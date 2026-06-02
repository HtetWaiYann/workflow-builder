import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from '@/lib/api'
import type { AuthResponse } from '@workflow-builder/shared'

const fakeAuthResponse: AuthResponse = {
  user: {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  workspaces: [
    {
      workspace: {
        id: 'ws-1',
        name: "Test's Workspace",
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      role: 'OWNER',
    },
  ],
}

function mockFetch(status: number, body: unknown) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

beforeEach(() => {
  vi.restoreAllMocks()
})

// Sends registration credentials to the backend and returns the new user's
// profile and workspace on success.
describe('api.auth.register', () => {
  it('posts to /auth/register and returns AuthResponse', async () => {
    mockFetch(201, fakeAuthResponse)
    const result = await api.auth.register({
      email: 'test@example.com',
      password: 'password123',
    })
    expect(result).toEqual(fakeAuthResponse)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/register'),
      expect.objectContaining({ method: 'POST' })
    )
  })
})

// Sends login credentials and returns the authenticated user's profile and
// workspace. The backend sets the JWT cookie; this call only handles the JSON.
describe('api.auth.login', () => {
  it('posts to /auth/login and returns AuthResponse', async () => {
    mockFetch(200, fakeAuthResponse)
    const result = await api.auth.login({
      email: 'test@example.com',
      password: 'password123',
    })
    expect(result).toEqual(fakeAuthResponse)
  })
})

// Notifies the backend to expire the session cookie. No request body needed.
describe('api.auth.logout', () => {
  it('posts to /auth/logout and returns success', async () => {
    mockFetch(200, { success: true })
    const result = await api.auth.logout()
    expect(result).toEqual({ success: true })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/logout'),
      expect.objectContaining({ method: 'POST' })
    )
  })
})

// Sends a credentialed GET to restore an existing session on page load.
// Credentials must be included so the browser sends the httpOnly cookie.
describe('api.auth.me', () => {
  it('gets /auth/me and returns AuthResponse', async () => {
    mockFetch(200, fakeAuthResponse)
    const result = await api.auth.me()
    expect(result).toEqual(fakeAuthResponse)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/me'),
      expect.objectContaining({ credentials: 'include' })
    )
  })
})

// All requests share the same error path: non-2xx responses throw an Error
// with `code` and `status` attached. Non-JSON error bodies fall back safely.
describe('error handling', () => {
  it('throws with code and status on non-ok response', async () => {
    mockFetch(401, { error: 'Unauthorized', code: 'INVALID_CREDENTIALS' })
    await expect(
      api.auth.login({ email: 'x@x.com', password: 'wrong' })
    ).rejects.toMatchObject({
      message: 'Unauthorized',
      code: 'INVALID_CREDENTIALS',
      status: 401,
    })
  })

  it('falls back gracefully when error body is not JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Internal Server Error', { status: 500 })
    )
    await expect(api.auth.me()).rejects.toMatchObject({
      message: 'Request failed',
      code: 'UNKNOWN',
      status: 500,
    })
  })
})
