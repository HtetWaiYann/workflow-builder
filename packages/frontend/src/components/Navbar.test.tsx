import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { useAuthStore } from '@/stores/authStore'

const mockNavigate = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

const fakeUser = {
  id: 'user-1',
  email: 'alice@example.com',
  name: 'Alice',
  createdAt: '2024-01-01T00:00:00.000Z',
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Navbar />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({
    user: null,
    workspaces: [],
    currentWorkspace: null,
    currentRole: null,
    isLoading: false,
  })
})

// Fixed top nav for all public pages. Auth actions appear only on "/" and "/docs";
// all other pages show the logo and shared nav actions only.
describe('Navbar', () => {
  it('renders the Docs link via NavActions', () => {
    renderAt('/')
    expect(screen.getByRole('link', { name: 'Docs' })).toBeInTheDocument()
  })

  it('renders the theme toggle button via NavActions', () => {
    renderAt('/')
    expect(
      screen.getByRole('button', { name: 'Change theme' })
    ).toBeInTheDocument()
  })

  it('shows Sign in and Get started on the landing page when unauthenticated', () => {
    renderAt('/')
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Get started' })
    ).toBeInTheDocument()
  })

  it('shows Sign in and Get started on the docs page when unauthenticated', () => {
    renderAt('/docs')
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Get started' })
    ).toBeInTheDocument()
  })

  it('hides auth buttons on non-landing public pages', () => {
    renderAt('/about')
    expect(
      screen.queryByRole('link', { name: 'Sign in' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Get started' })
    ).not.toBeInTheDocument()
  })

  it('shows the user avatar button when authenticated on the landing page', () => {
    useAuthStore.setState({
      ...useAuthStore.getState(),
      user: fakeUser,
      isLoading: false,
    })
    renderAt('/')
    expect(screen.getByTitle('Open app')).toBeInTheDocument()
  })

  it('navigates to /workflows when the avatar button is clicked', async () => {
    useAuthStore.setState({
      ...useAuthStore.getState(),
      user: fakeUser,
      isLoading: false,
    })
    renderAt('/')
    await userEvent.click(screen.getByTitle('Open app'))
    expect(mockNavigate).toHaveBeenCalledWith('/workflows')
  })

  it('hides auth content while isLoading is true', () => {
    useAuthStore.setState({
      ...useAuthStore.getState(),
      isLoading: true,
    })
    renderAt('/')
    expect(
      screen.queryByRole('link', { name: 'Sign in' })
    ).not.toBeInTheDocument()
    expect(screen.queryByTitle('Open app')).not.toBeInTheDocument()
  })
})
