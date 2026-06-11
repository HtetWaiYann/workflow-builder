import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AcceptInvitePage } from '@/pages/AcceptInvitePage'
import { useAuthStore } from '@/stores/authStore'
import type { User } from '@triggr/shared'

const mockNavigate = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('@/lib/api', () => ({
  api: {
    workspaces: {
      getInvite: vi.fn(),
      acceptInvite: vi.fn(),
      rejectInvite: vi.fn(),
    },
    auth: { me: vi.fn(), logout: vi.fn() },
  },
}))

import { api } from '@/lib/api'
const mockGetInvite = vi.mocked(api.workspaces.getInvite)
const mockAcceptInvite = vi.mocked(api.workspaces.acceptInvite)
const mockRejectInvite = vi.mocked(api.workspaces.rejectInvite)
const mockMe = vi.mocked(api.auth.me)

const fakeUser: User = {
  id: 'user-1',
  email: 'invited@example.com',
  name: 'Invited',
  createdAt: '2024-01-01T00:00:00.000Z',
}

const fakeInvite = {
  id: 'inv-1',
  email: 'invited@example.com',
  role: 'EDITOR' as const,
  expiresAt: '2099-01-01T00:00:00.000Z',
  workspace: { id: 'ws-1', name: 'Acme Corp', createdAt: '' },
  invitedBy: {
    id: 'owner-1',
    email: 'owner@example.com',
    name: 'Owner',
    createdAt: '',
  },
}

function renderPage(token = 'tok-abc') {
  return render(
    <MemoryRouter initialEntries={[`/invites/${token}`]}>
      <Routes>
        <Route path="/invites/:token" element={<AcceptInvitePage />} />
      </Routes>
    </MemoryRouter>
  )
}

// Invite acceptance page that previews the invite, handles auth state mismatches,
// and lets authenticated users accept or decline the invite.
describe('AcceptInvitePage', () => {
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

  it('shows the loading screen while the invite is being fetched', () => {
    mockGetInvite.mockReturnValueOnce(new Promise(() => {}))
    renderPage()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows an error state when the invite token is invalid', async () => {
    mockGetInvite.mockRejectedValueOnce(new Error('not found'))
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Invite not found')).toBeInTheDocument()
    })
  })

  it('shows login and register buttons when user is not authenticated', async () => {
    mockGetInvite.mockResolvedValueOnce({ invite: fakeInvite })
    renderPage()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Register' })
      ).toBeInTheDocument()
    })
  })

  it('shows the workspace name and inviter in the invite card', async () => {
    mockGetInvite.mockResolvedValueOnce({ invite: fakeInvite })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
      expect(screen.getByText('Owner')).toBeInTheDocument()
    })
  })

  it('shows a wrong account notice when the logged-in user email does not match', async () => {
    useAuthStore.setState({
      user: { ...fakeUser, email: 'other@example.com' },
      workspaces: [],
      currentWorkspace: null,
      currentRole: null,
      isLoading: false,
    })
    mockGetInvite.mockResolvedValueOnce({ invite: fakeInvite })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Wrong account')).toBeInTheDocument()
    })
  })

  it('shows accept and decline buttons when user email matches', async () => {
    useAuthStore.setState({
      user: fakeUser,
      workspaces: [],
      currentWorkspace: null,
      currentRole: null,
      isLoading: false,
    })
    mockGetInvite.mockResolvedValueOnce({ invite: fakeInvite })
    renderPage()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Decline' })
      ).toBeInTheDocument()
    })
  })

  it('navigates to /workflows after a successful accept', async () => {
    useAuthStore.setState({
      user: fakeUser,
      workspaces: [],
      currentWorkspace: null,
      currentRole: null,
      isLoading: false,
    })
    mockGetInvite.mockResolvedValueOnce({ invite: fakeInvite })
    mockAcceptInvite.mockResolvedValueOnce({ role: 'EDITOR' })
    mockMe.mockResolvedValueOnce({ user: fakeUser, workspaces: [] })
    renderPage()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument()
    )
    await userEvent.click(screen.getByRole('button', { name: 'Accept' }))
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/workflows')
    })
  })

  it('navigates to /workflows after a successful decline', async () => {
    useAuthStore.setState({
      user: fakeUser,
      workspaces: [],
      currentWorkspace: null,
      currentRole: null,
      isLoading: false,
    })
    mockGetInvite.mockResolvedValueOnce({ invite: fakeInvite })
    mockRejectInvite.mockResolvedValueOnce(undefined)
    renderPage()
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Decline' })
      ).toBeInTheDocument()
    )
    await userEvent.click(screen.getByRole('button', { name: 'Decline' }))
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/workflows')
    })
  })

  it('shows "already a member" message when user is already in the workspace', async () => {
    useAuthStore.setState({
      user: fakeUser,
      workspaces: [
        {
          workspace: { id: 'ws-1', name: 'Acme Corp', createdAt: '' },
          role: 'EDITOR',
        },
      ],
      currentWorkspace: { id: 'ws-1', name: 'Acme Corp', createdAt: '' },
      currentRole: 'EDITOR',
      isLoading: false,
    })
    mockGetInvite.mockResolvedValueOnce({ invite: fakeInvite })
    renderPage()
    await waitFor(() => {
      expect(
        screen.getByText(/You are already a member of this workspace/i)
      ).toBeInTheDocument()
    })
  })
})
