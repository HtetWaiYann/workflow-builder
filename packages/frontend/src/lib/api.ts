import type { AuthResponse } from '@workflow-builder/shared'

const BASE_URL = 'http://localhost:3000'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })

  if (!res.ok) {
    const body = await res
      .json()
      .catch(() => ({ error: 'Request failed', code: 'UNKNOWN' }))
    const err = new Error(
      (body as { error?: string }).error ?? 'Request failed'
    ) as Error & {
      code: string
      status: number
    }
    err.code = (body as { code?: string }).code ?? 'UNKNOWN'
    err.status = res.status
    throw err
  }

  return res.json() as Promise<T>
}

export const api = {
  auth: {
    register: (data: { email: string; password: string; name?: string }) =>
      request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    login: (data: { email: string; password: string }) =>
      request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    logout: () =>
      request<{ success: boolean }>('/auth/logout', { method: 'POST' }),

    me: () => request<AuthResponse>('/auth/me'),
  },
}
