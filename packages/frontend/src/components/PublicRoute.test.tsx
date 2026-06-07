import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { PublicRoute } from '@/components/PublicRoute'
import { useAuthStore } from '@/stores/authStore'
import type { User } from '@workflow-builder/shared'

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

function renderRoute(
  initialPath = '/login',
  children = <div>public content</div>
) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<PublicRoute>{children}</PublicRoute>} />
        <Route path="/dashboard" element={<div>dashboard</div>} />
        <Route path="/invites/:token" element={<div>invite page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

// Protects auth pages from logged-in users. Shows a loading gate while the
// session check is in-flight to avoid flashing the login form before redirecting.
describe('PublicRoute', () => {
  it('shows the loading placeholder while auth is initialising', () => {
    renderRoute()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders children when the user is not authenticated', () => {
    useAuthStore.setState({
      user: null,
      workspaces: [],
      currentWorkspace: null,
      currentRole: null,
      isLoading: false,
    })
    renderRoute()
    expect(screen.getByText('public content')).toBeInTheDocument()
  })

  it('redirects to /dashboard when authenticated with no redirect param', () => {
    useAuthStore.setState({
      user: fakeUser,
      workspaces: [],
      currentWorkspace: null,
      currentRole: null,
      isLoading: false,
    })
    renderRoute('/login')
    expect(screen.queryByText('public content')).not.toBeInTheDocument()
    expect(screen.getByText('dashboard')).toBeInTheDocument()
  })

  it('redirects to the redirect param when authenticated', () => {
    useAuthStore.setState({
      user: fakeUser,
      workspaces: [],
      currentWorkspace: null,
      currentRole: null,
      isLoading: false,
    })
    renderRoute('/login?redirect=/invites/abc123')
    expect(screen.queryByText('public content')).not.toBeInTheDocument()
    expect(screen.getByText('invite page')).toBeInTheDocument()
  })
})
