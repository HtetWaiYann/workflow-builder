import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { TopBar } from '@/components/TopBar'
import { useAuthStore } from '@/stores/authStore'

const mockNavigate = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('@/lib/api', () => ({
  api: { auth: { logout: vi.fn() } },
}))

import { api } from '@/lib/api'
const mockLogout = vi.mocked(api.auth.logout)

function renderTopBar() {
  return render(
    <MemoryRouter>
      <TopBar />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  // Use different first letters so workspace badge ('A') and user avatar ('B') are unambiguous.
  useAuthStore.setState({
    user: {
      id: 'user-1',
      email: 'bob@example.com',
      name: 'Bob',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    workspace: {
      id: 'ws-1',
      name: 'Acme Corp',
      userId: 'user-1',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    isLoading: false,
  })
})

// Persistent header shown on every protected page. Workspace badge and name
// are read-only; the user avatar opens a dropdown for account actions.
describe('TopBar', () => {
  it('displays the workspace name and its first-letter badge', () => {
    renderTopBar()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('shows the user initial in the avatar button', () => {
    renderTopBar()
    expect(screen.getByRole('button', { name: 'B' })).toBeInTheDocument()
  })

  it('opens a dropdown with Log out on avatar click', async () => {
    renderTopBar()
    await userEvent.click(screen.getByRole('button', { name: 'B' }))
    expect(screen.getByText('Log out')).toBeInTheDocument()
  })

  it('calls logout, clears auth, and navigates to /login', async () => {
    mockLogout.mockResolvedValueOnce({ success: true })
    renderTopBar()
    await userEvent.click(screen.getByRole('button', { name: 'B' }))
    await userEvent.click(screen.getByText('Log out'))
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled()
      expect(useAuthStore.getState().user).toBeNull()
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })

  it('still clears auth and navigates even when the logout API call fails', async () => {
    mockLogout.mockRejectedValueOnce(new Error('Network error'))
    renderTopBar()
    await userEvent.click(screen.getByRole('button', { name: 'B' }))
    await userEvent.click(screen.getByText('Log out'))
    await waitFor(() => {
      expect(useAuthStore.getState().user).toBeNull()
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })
})
