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
  Execution,
  ExecutionSummary,
  WorkspaceVariable,
  CreateWorkspaceVariableRequest,
  UpdateWorkspaceVariableRequest,
  WorkspaceMembership,
  WorkspaceMember,
  WorkspaceMemberRole,
  Workspace,
  User,
  CreateWorkspaceRequest,
  UpdateWorkspaceNameRequest,
  InviteMemberRequest,
  UpdateMemberRoleRequest,
  PendingInvite,
  WebhookSecretStatus,
  WebhookSecretGenerated,
} from '@workflow-builder/shared'
import { useAuthStore } from '@/stores/authStore'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

/**
 * Sends a JSON request to the API with credentials (cookies) included.
 * Automatically injects the `X-Workspace-ID` header from the active workspace in the auth store.
 * An explicit `X-Workspace-ID` in `options.headers` takes precedence (for cross-workspace operations).
 * On non-OK responses, parses the error body and throws with `code` and `status` attached.
 *
 * @param path - URL path relative to BASE_URL (e.g. `/auth/login`)
 * @param options - Optional fetch init; `Content-Type: application/json` is set by default
 * @throws {Error & { code: string; status: number }} when the server returns a non-OK status
 */
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const workspaceId = useAuthStore.getState().currentWorkspace?.id
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(workspaceId ? { 'X-Workspace-ID': workspaceId } : {}),
      ...options?.headers,
    },
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

/** Shape of a pending invite preview returned by `GET /workspaces/invites/:token`. */
export interface InvitePreview {
  id: string
  email: string
  role: WorkspaceMemberRole
  expiresAt: string
  workspace: Workspace
  invitedBy: User
}

/** Shape of a created invite returned by `POST /workspaces/:id/invites`. */
export interface CreatedInvite {
  id: string
  email: string
  role: WorkspaceMemberRole
  expiresAt: string
  createdAt: string
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

  workspaces: {
    list: () => request<{ workspaces: WorkspaceMembership[] }>('/workspaces'),

    create: (data: CreateWorkspaceRequest) =>
      request<{ workspace: Workspace; role: WorkspaceMemberRole }>(
        '/workspaces',
        { method: 'POST', body: JSON.stringify(data) }
      ),

    updateName: (workspaceId: string, data: UpdateWorkspaceNameRequest) =>
      request<{ workspace: Workspace }>(`/workspaces/${workspaceId}/name`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'X-Workspace-ID': workspaceId },
      }),

    listMembers: (workspaceId: string) =>
      request<{ members: WorkspaceMember[] }>(
        `/workspaces/${workspaceId}/members`,
        { headers: { 'X-Workspace-ID': workspaceId } }
      ),

    invite: (workspaceId: string, data: InviteMemberRequest) =>
      request<{ invite: CreatedInvite }>(`/workspaces/${workspaceId}/invites`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'X-Workspace-ID': workspaceId },
      }),

    getInvite: (token: string) =>
      request<{ invite: InvitePreview }>(`/workspaces/invites/${token}`),

    listInvites: (workspaceId: string) =>
      request<{ invites: PendingInvite[] }>(
        `/workspaces/${workspaceId}/invites`,
        { headers: { 'X-Workspace-ID': workspaceId } }
      ),

    revokeInvite: (workspaceId: string, inviteId: string) =>
      request<void>(`/workspaces/${workspaceId}/invites/${inviteId}`, {
        method: 'DELETE',
        headers: { 'X-Workspace-ID': workspaceId },
      }),

    resendInvite: (workspaceId: string, inviteId: string) =>
      request<{ invite: PendingInvite }>(
        `/workspaces/${workspaceId}/invites/${inviteId}/resend`,
        { method: 'POST', headers: { 'X-Workspace-ID': workspaceId } }
      ),

    acceptInvite: (token: string) =>
      request<{ workspaceId: string; role: WorkspaceMemberRole }>(
        `/workspaces/invites/${token}/accept`,
        { method: 'POST' }
      ),

    rejectInvite: (token: string) =>
      request<void>(`/workspaces/invites/${token}/reject`, { method: 'POST' }),

    updateMemberRole: (
      workspaceId: string,
      userId: string,
      data: UpdateMemberRoleRequest
    ) =>
      request<{ member: WorkspaceMember }>(
        `/workspaces/${workspaceId}/members/${userId}/role`,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
          headers: { 'X-Workspace-ID': workspaceId },
        }
      ),

    removeMember: (workspaceId: string, userId: string) =>
      request<void>(`/workspaces/${workspaceId}/members/${userId}`, {
        method: 'DELETE',
        headers: { 'X-Workspace-ID': workspaceId },
      }),
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

  executions: {
    trigger: (workflowId: string, inputData?: Record<string, unknown>) =>
      request<{ execution: ExecutionSummary }>(
        `/workflows/${workflowId}/executions`,
        { method: 'POST', body: JSON.stringify({ inputData }) }
      ),

    list: (workflowId: string, limit = 20) =>
      request<{ executions: ExecutionSummary[] }>(
        `/workflows/${workflowId}/executions?limit=${limit}`
      ),

    get: (executionId: string) =>
      request<{ execution: Execution }>(`/executions/${executionId}`),
  },

  webhookSecrets: {
    get: (workflowId: string, nodeId: string) =>
      request<WebhookSecretStatus>(
        `/workflows/${workflowId}/nodes/${nodeId}/webhook-secret`
      ),

    generate: (workflowId: string, nodeId: string) =>
      request<WebhookSecretGenerated>(
        `/workflows/${workflowId}/nodes/${nodeId}/webhook-secret`,
        { method: 'POST' }
      ),

    delete: (workflowId: string, nodeId: string) =>
      request<void>(`/workflows/${workflowId}/nodes/${nodeId}/webhook-secret`, {
        method: 'DELETE',
      }),
  },

  variables: {
    list: () =>
      request<{ variables: WorkspaceVariable[] }>('/workspace/variables'),

    create: (data: CreateWorkspaceVariableRequest) =>
      request<{ variable: WorkspaceVariable }>('/workspace/variables', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: UpdateWorkspaceVariableRequest) =>
      request<{ variable: WorkspaceVariable }>(`/workspace/variables/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<void>(`/workspace/variables/${id}`, { method: 'DELETE' }),
  },
}
