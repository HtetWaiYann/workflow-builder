import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
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
  useAuthStore.setState({ user: null, workspace: null, isLoading: true })
})

function renderRoute(children = <div>public content</div>) {
  return render(
    <MemoryRouter>
      <PublicRoute>{children}</PublicRoute>
    </MemoryRouter>
  )
}

// Protects auth pages from logged-in users. Shows a loading gate while the
// session check is in-flight to avoid flashing the login form before redirecting.
describe('PublicRoute', () => {
  it('shows the loading placeholder while auth is initialising', () => {
    renderRoute()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('renders children when the user is not authenticated', () => {
    useAuthStore.setState({ user: null, workspace: null, isLoading: false })
    renderRoute()
    expect(screen.getByText('public content')).toBeInTheDocument()
  })

  it('redirects away and hides children when the user is already logged in', () => {
    useAuthStore.setState({ user: fakeUser, workspace: null, isLoading: false })
    const { container } = renderRoute()
    expect(screen.queryByText('public content')).not.toBeInTheDocument()
    expect(container.firstChild).toBeNull()
  })
})
