import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { RegisterPage } from '@/pages/RegisterPage'
import { useAuthStore } from '@/stores/authStore'
import type { AuthResponse } from '@triggr/shared'

const mockNavigate = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('@/lib/api', () => ({
  api: { auth: { register: vi.fn() } },
}))

import { api } from '@/lib/api'
const mockRegister = vi.mocked(api.auth.register)

const fakeResponse: AuthResponse = {
  user: {
    id: 'user-1',
    email: 'new@example.com',
    name: 'New User',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  workspaces: [
    {
      workspace: {
        id: 'ws-1',
        name: "New User's Workspace",
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      role: 'OWNER',
    },
  ],
}

function renderPage() {
  return render(
    <MemoryRouter>
      <RegisterPage />
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

// Account creation form that posts to the API, stores the new user and their
// auto-created workspace on success, and redirects to the dashboard. Handles
// optional name, surfaces API errors inline, and prevents double-submission.
describe('RegisterPage', () => {
  it('renders name, email, password fields and a submit button', () => {
    renderPage()
    expect(screen.getByLabelText('Name (optional)')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Create account' })
    ).toBeInTheDocument()
  })

  it('calls api.auth.register with the entered data', async () => {
    mockRegister.mockResolvedValueOnce(fakeResponse)
    renderPage()

    await userEvent.type(screen.getByLabelText('Name (optional)'), 'New User')
    await userEvent.type(screen.getByLabelText('Email'), 'new@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'Password1!')
    await userEvent.click(
      screen.getByRole('button', { name: 'Create account' })
    )

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'Password1!',
        name: 'New User',
      })
    })
  })

  it('omits name when the field is left empty', async () => {
    mockRegister.mockResolvedValueOnce(fakeResponse)
    renderPage()

    await userEvent.type(screen.getByLabelText('Email'), 'new@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'Password1!')
    await userEvent.click(
      screen.getByRole('button', { name: 'Create account' })
    )

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'Password1!',
        name: undefined,
      })
    })
  })

  it('updates the store and navigates to / on success', async () => {
    mockRegister.mockResolvedValueOnce(fakeResponse)
    renderPage()

    await userEvent.type(screen.getByLabelText('Email'), 'new@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'Password1!')
    await userEvent.click(
      screen.getByRole('button', { name: 'Create account' })
    )

    await waitFor(() => {
      expect(useAuthStore.getState().user).toEqual(fakeResponse.user)
      expect(useAuthStore.getState().currentWorkspace).toEqual(
        fakeResponse.workspaces[0].workspace
      )
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows an error message on failure', async () => {
    mockRegister.mockRejectedValueOnce(new Error('Email already in use'))
    renderPage()

    await userEvent.type(screen.getByLabelText('Email'), 'taken@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'Password1!')
    await userEvent.click(
      screen.getByRole('button', { name: 'Create account' })
    )

    await waitFor(() => {
      expect(screen.getByText('Email already in use')).toBeInTheDocument()
    })
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('disables the button while submitting', async () => {
    let resolve!: (v: AuthResponse) => void
    mockRegister.mockReturnValueOnce(new Promise((r) => (resolve = r)))
    renderPage()

    await userEvent.type(screen.getByLabelText('Email'), 'new@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'Password1!')
    await userEvent.click(
      screen.getByRole('button', { name: 'Create account' })
    )

    expect(
      screen.getByRole('button', { name: 'Creating account…' })
    ).toBeDisabled()

    resolve(fakeResponse)
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Create account' })
      ).not.toBeDisabled()
    })
  })
})
