import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { CreateFirstWorkspacePage } from '@/pages/CreateFirstWorkspacePage'
import { useAuthStore } from '@/stores/authStore'
import type { User } from '@triggr/shared'

const mockNavigate = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('@/lib/api', () => ({
  api: {
    workspaces: { create: vi.fn() },
  },
}))

import { api } from '@/lib/api'
const mockCreate = vi.mocked(api.workspaces.create)

const fakeUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test',
  createdAt: '2024-01-01T00:00:00.000Z',
}

function renderPage() {
  return render(
    <MemoryRouter>
      <CreateFirstWorkspacePage />
    </MemoryRouter>
  )
}

// Form page for creating the first (or an additional) workspace. Submits to the
// API and navigates to /workflows on success.
describe('CreateFirstWorkspacePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      user: fakeUser,
      workspaces: [],
      currentWorkspace: null,
      currentRole: null,
      isLoading: false,
    })
  })

  it('renders the workspace name input and submit button', () => {
    renderPage()
    expect(screen.getByLabelText('Workspace name')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Create workspace' })
    ).toBeInTheDocument()
  })

  it('disables the submit button when the name is empty', () => {
    renderPage()
    expect(
      screen.getByRole('button', { name: 'Create workspace' })
    ).toBeDisabled()
  })

  it('enables the submit button when the name is filled', async () => {
    renderPage()
    await userEvent.type(screen.getByLabelText('Workspace name'), 'Acme')
    expect(
      screen.getByRole('button', { name: 'Create workspace' })
    ).not.toBeDisabled()
  })

  it('does not show the back button when there are no existing workspaces', () => {
    renderPage()
    expect(screen.queryByText('Back')).not.toBeInTheDocument()
  })

  it('shows the back button when the user already has a workspace', () => {
    useAuthStore.setState({
      workspaces: [
        {
          workspace: { id: 'ws-1', name: 'Old WS', createdAt: '' },
          role: 'OWNER',
        },
      ],
    })
    renderPage()
    expect(screen.getByText('Back')).toBeInTheDocument()
  })

  it('calls the API and navigates to /workflows on success', async () => {
    const fakeWs = { id: 'ws-new', name: 'Acme', createdAt: '' }
    mockCreate.mockResolvedValueOnce({ workspace: fakeWs, role: 'OWNER' })
    renderPage()
    await userEvent.type(screen.getByLabelText('Workspace name'), 'Acme')
    await userEvent.click(
      screen.getByRole('button', { name: 'Create workspace' })
    )
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({ name: 'Acme' })
      expect(mockNavigate).toHaveBeenCalledWith('/workflows', { replace: true })
    })
  })

  it('shows an error message when the API call fails', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Name already taken'))
    renderPage()
    await userEvent.type(screen.getByLabelText('Workspace name'), 'Acme')
    await userEvent.click(
      screen.getByRole('button', { name: 'Create workspace' })
    )
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Name already taken')
    })
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('disables the button while the request is in flight', async () => {
    let resolve!: (v: { workspace: typeof fakeUser; role: string }) => void
    mockCreate.mockReturnValueOnce(new Promise((r) => (resolve = r as never)))
    renderPage()
    await userEvent.type(screen.getByLabelText('Workspace name'), 'Acme')
    await userEvent.click(
      screen.getByRole('button', { name: 'Create workspace' })
    )
    expect(screen.getByRole('button', { name: 'Creating…' })).toBeDisabled()
    resolve({
      workspace: { id: 'ws-1', name: 'Acme', createdAt: '' } as never,
      role: 'OWNER',
    })
  })
})
