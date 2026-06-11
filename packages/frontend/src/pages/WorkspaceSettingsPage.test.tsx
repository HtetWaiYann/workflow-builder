import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { WorkspaceSettingsPage } from '@/pages/WorkspaceSettingsPage'
import { useAuthStore } from '@/stores/authStore'
import type { User, WorkspaceMember } from '@triggr/shared'

const mockNavigate = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('@/lib/api', () => ({
  api: {
    workspaces: {
      listMembers: vi.fn(),
      listInvites: vi.fn(),
      invite: vi.fn(),
      updateMemberRole: vi.fn(),
      removeMember: vi.fn(),
      revokeInvite: vi.fn(),
      resendInvite: vi.fn(),
      updateName: vi.fn(),
    },
  },
}))

import { api } from '@/lib/api'
const mockListMembers = vi.mocked(api.workspaces.listMembers)
const mockListInvites = vi.mocked(api.workspaces.listInvites)

const fakeUser: User = {
  id: 'user-1',
  email: 'owner@example.com',
  name: 'Owner',
  createdAt: '2024-01-01T00:00:00.000Z',
}

const fakeMember: WorkspaceMember = {
  id: 'mem-1',
  userId: 'user-1',
  workspaceId: 'ws-1',
  role: 'OWNER',
  createdAt: '2024-01-01T00:00:00.000Z',
  user: {
    id: 'user-1',
    email: 'owner@example.com',
    name: 'Owner',
    createdAt: '',
  },
}

function renderPage(role: 'OWNER' | 'EDITOR' | 'VIEWER' = 'OWNER') {
  useAuthStore.setState({
    user: fakeUser,
    workspaces: [
      {
        workspace: { id: 'ws-1', name: 'Acme', createdAt: '' },
        role,
      },
    ],
    currentWorkspace: { id: 'ws-1', name: 'Acme', createdAt: '' },
    currentRole: role,
    isLoading: false,
  })
  return render(
    <MemoryRouter initialEntries={['/workspaces/ws-1/settings']}>
      <Routes>
        <Route
          path="/workspaces/:workspaceId/settings"
          element={<WorkspaceSettingsPage />}
        />
      </Routes>
    </MemoryRouter>
  )
}

// Settings page for managing workspace name, members, and invites.
// Owners see the invite form and role-change controls; non-owners see read-only views.
describe('WorkspaceSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListMembers.mockResolvedValue({ members: [fakeMember] })
    mockListInvites.mockResolvedValue({ invites: [] })
  })

  it('renders the workspace settings heading', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Workspace Settings')).toBeInTheDocument()
    })
  })

  it('shows the invite form for OWNER role', async () => {
    renderPage('OWNER')
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('colleague@example.com')
      ).toBeInTheDocument()
    })
  })

  it('hides the invite form for non-OWNER roles', async () => {
    mockListInvites.mockResolvedValue({ invites: [] })
    renderPage('EDITOR')
    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText('colleague@example.com')
      ).not.toBeInTheDocument()
    })
  })

  it('renders the loaded member list', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('owner@example.com')).toBeInTheDocument()
    })
  })

  it('shows a loading state initially', () => {
    mockListMembers.mockReturnValueOnce(new Promise(() => {}))
    renderPage()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('renders a save button for the workspace name when OWNER', async () => {
    renderPage('OWNER')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    })
  })

  it('shows the workspace name as plain text for non-OWNER', async () => {
    renderPage('EDITOR')
    // No editable input or Save button — workspace name is read-only
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'Save' })
      ).not.toBeInTheDocument()
      // The name appears as a plain <p> (not inside a form input)
      expect(
        screen.queryByRole('textbox', { name: 'Workspace name' })
      ).not.toBeInTheDocument()
    })
    // Workspace name text appears somewhere on the page (TopBar + the paragraph)
    expect(screen.getAllByText('Acme').length).toBeGreaterThan(0)
  })

  it('navigates back to /workflows when back button is clicked', async () => {
    renderPage()
    await waitFor(() =>
      expect(screen.getByText('Back to workflows')).toBeInTheDocument()
    )
    await userEvent.click(screen.getByText('Back to workflows'))
    expect(mockNavigate).toHaveBeenCalledWith('/workflows')
  })
})
