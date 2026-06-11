import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { WorkspaceRoute } from '@/components/WorkspaceRoute'
import { useAuthStore } from '@/stores/authStore'
import type { User } from '@triggr/shared'

const fakeUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test',
  createdAt: '2024-01-01T00:00:00.000Z',
}

const fakeWorkspace = {
  workspace: {
    id: 'ws-1',
    name: 'Acme',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  role: 'OWNER' as const,
}

function renderRoute(children = <div>workspace content</div>) {
  return render(
    <MemoryRouter>
      <WorkspaceRoute>{children}</WorkspaceRoute>
    </MemoryRouter>
  )
}

// Extends ProtectedRoute to also require an active workspace. Authenticated users
// without a workspace are redirected to /workspaces/new.
describe('WorkspaceRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      workspaces: [],
      currentWorkspace: null,
      currentRole: null,
      isLoading: false,
    })
  })

  it('shows the loading spinner while auth is resolving', () => {
    useAuthStore.setState({ isLoading: true })
    renderRoute()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('does not render children when user is unauthenticated', () => {
    renderRoute()
    expect(screen.queryByText('workspace content')).not.toBeInTheDocument()
  })

  it('redirects to /workspaces/new when user has no workspace', () => {
    useAuthStore.setState({
      user: fakeUser,
      workspaces: [],
      currentWorkspace: null,
      currentRole: null,
      isLoading: false,
    })
    renderRoute()
    expect(screen.queryByText('workspace content')).not.toBeInTheDocument()
  })

  it('renders children when user has an active workspace', () => {
    useAuthStore.setState({
      user: fakeUser,
      workspaces: [fakeWorkspace],
      currentWorkspace: fakeWorkspace.workspace,
      currentRole: 'OWNER',
      isLoading: false,
    })
    renderRoute()
    expect(screen.getByText('workspace content')).toBeInTheDocument()
  })
})
