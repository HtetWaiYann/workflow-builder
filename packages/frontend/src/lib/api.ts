import type {
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  WorkflowSummary,
  Workflow,
  CreateWorkflowRequest,
  RenameWorkflowRequest,
  WorkflowNode,
  WorkflowEdge,
} from '@workflow-builder/shared'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

/**
 * Sends a JSON request to the API with credentials (cookies) included.
 * On non-OK responses, parses the error body and throws with `code` and `status` attached.
 *
 * @param path - URL path relative to BASE_URL (e.g. `/auth/login`)
 * @param options - Optional fetch init; `Content-Type: application/json` is set by default
 * @throws {Error & { code: string; status: number }} when the server returns a non-OK status
 */
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

  // 204 No Content — body is empty and res.json() would throw
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  auth: {
    register: (data: RegisterRequest) =>
      request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    login: (data: LoginRequest) =>
      request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    logout: () =>
      request<{ success: boolean }>('/auth/logout', { method: 'POST' }),

    me: () => request<AuthResponse>('/auth/me'),
  },

  workflows: {
    list: () => request<{ workflows: WorkflowSummary[] }>('/workflows'),

    get: (id: string) => request<{ workflow: Workflow }>(`/workflows/${id}`),

    create: (data: CreateWorkflowRequest) =>
      request<{ workflow: Workflow }>('/workflows', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    rename: (id: string, data: RenameWorkflowRequest) =>
      request<{ workflow: WorkflowSummary }>(`/workflows/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<void>(`/workflows/${id}`, { method: 'DELETE' }),

    activate: (id: string) =>
      request<{ workflow: WorkflowSummary }>(`/workflows/${id}/activate`, {
        method: 'POST',
      }),

    deactivate: (id: string) =>
      request<{ workflow: WorkflowSummary }>(`/workflows/${id}/deactivate`, {
        method: 'POST',
      }),

    duplicate: (id: string) =>
      request<{ workflow: Workflow }>(`/workflows/${id}/duplicate`, {
        method: 'POST',
      }),

    saveCanvas: (id: string, nodes: WorkflowNode[], edges: WorkflowEdge[]) =>
      request<{ workflow: Workflow }>(`/workflows/${id}/graph`, {
        method: 'PUT',
        body: JSON.stringify({ nodes, edges }),
      }),

    updateWorkflowName: (id: string, name: string) =>
      request<{ data: { id: string; name: string } }>(`/workflows/${id}/name`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      }),
  },
}
