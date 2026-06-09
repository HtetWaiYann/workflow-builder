import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from '@/pages/LoginPage'
import { useAuthStore } from '@/stores/authStore'
import type { AuthResponse } from '@triggr/shared'

const mockNavigate = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('@/lib/api', () => ({
  api: { auth: { login: vi.fn() } },
}))

import { api } from '@/lib/api'
const mockLogin = vi.mocked(api.auth.login)

const fakeResponse: AuthResponse = {
  user: {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  workspaces: [],
}

function renderPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
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

// Sign-in form that posts credentials to the API, stores the authenticated user
// on success, and redirects to the dashboard. Displays inline errors on failure
// and prevents double-submission by disabling the button during the request.
describe('LoginPage', () => {
  it('renders email, password fields and a submit button', () => {
    renderPage()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('calls api.auth.login with the entered credentials', async () => {
    mockLogin.mockResolvedValueOnce(fakeResponse)
    renderPage()

    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('updates the store and navigates to / on success', async () => {
    mockLogin.mockResolvedValueOnce(fakeResponse)
    renderPage()

    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(useAuthStore.getState().user).toEqual(fakeResponse.user)
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows an error message on failure', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'))
    renderPage()

    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('disables the button while submitting', async () => {
    let resolve!: (v: AuthResponse) => void
    mockLogin.mockReturnValueOnce(new Promise((r) => (resolve = r)))
    renderPage()

    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(screen.getByRole('button', { name: 'Signing in…' })).toBeDisabled()

    resolve(fakeResponse)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign in' })).not.toBeDisabled()
    })
  })
})
