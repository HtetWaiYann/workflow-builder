import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuthStore } from '@/stores/authStore'
import type { User } from '@triggr/shared'

const fakeUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test',
  createdAt: '2024-01-01T00:00:00.000Z',
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

function renderRoute(children = <div>protected content</div>) {
  return render(
    <MemoryRouter>
      <ProtectedRoute>{children}</ProtectedRoute>
    </MemoryRouter>
  )
}

// Guards a route subtree from unauthenticated access. Shows a loading placeholder
// while the session check is in-flight, redirects to /login when unauthenticated,
// and renders children only once a user is confirmed in the store.
describe('ProtectedRoute', () => {
  it('shows the loading spinner while isLoading is true', () => {
    renderRoute()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('redirects to /login when user is null and not loading', () => {
    useAuthStore.setState({
      user: null,
      workspaces: [],
      currentWorkspace: null,
      currentRole: null,
      isLoading: false,
    })
    const { container } = renderRoute()
    expect(screen.queryByText('protected content')).not.toBeInTheDocument()
    expect(container.firstChild).toBeNull()
  })

  it('renders children when user is authenticated', () => {
    useAuthStore.setState({
      user: fakeUser,
      workspaces: [],
      currentWorkspace: null,
      currentRole: null,
      isLoading: false,
    })
    renderRoute()
    expect(screen.getByText('protected content')).toBeInTheDocument()
  })
})
