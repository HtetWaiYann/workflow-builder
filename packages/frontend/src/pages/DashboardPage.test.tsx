import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { DashboardPage } from '@/pages/DashboardPage'
import { useAuthStore } from '@/stores/authStore'
import { useWorkflowStore } from '@/stores/workflowStore'
import type { WorkflowSummary, Workflow } from '@workflow-builder/shared'

const mockNavigate = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('@/lib/api', () => ({
  api: {
    auth: { logout: vi.fn() },
    workflows: {
      list: vi.fn(),
      create: vi.fn(),
      rename: vi.fn(),
      duplicate: vi.fn(),
      activate: vi.fn(),
      deactivate: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

import { api } from '@/lib/api'
const mockList = vi.mocked(api.workflows.list)
const mockCreate = vi.mocked(api.workflows.create)

function makeWorkflowSummary(id: string, name: string): WorkflowSummary {
  return {
    id,
    workspaceId: 'ws-1',
    name,
    status: 'ACTIVE',
    runCount: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  }
}

function makeWorkflow(id: string, name: string): Workflow {
  return { ...makeWorkflowSummary(id, name), nodes: [], edges: [] }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({
    user: {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    workspaces: [
      {
        workspace: {
          id: 'ws-1',
          name: 'Acme Corp',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        role: 'OWNER',
      },
    ],
    currentWorkspace: {
      id: 'ws-1',
      name: 'Acme Corp',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    currentRole: 'OWNER',
    isLoading: false,
  })
  useWorkflowStore.setState({ workflows: [], isLoading: false, error: null })
})

// Main authenticated view. Fetches the workflow list on mount and transitions
// through loading → data/error/empty states. All mutations go through the store
// so the list stays in sync without a refetch.
describe('DashboardPage', () => {
  it('shows a loading indicator while the list is fetching', () => {
    mockList.mockReturnValueOnce(new Promise(() => {}))
    renderPage()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('shows an error state when the fetch fails', async () => {
    mockList.mockRejectedValueOnce(new Error('Network error'))
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Failed to load workflows')).toBeInTheDocument()
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('shows an empty state when no workflows exist', async () => {
    mockList.mockResolvedValueOnce({ workflows: [] })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('No workflows yet')).toBeInTheDocument()
    })
  })

  it('renders a card for each workflow returned', async () => {
    mockList.mockResolvedValueOnce({
      workflows: [
        makeWorkflowSummary('1', 'Newsletter'),
        makeWorkflowSummary('2', 'Sync Data'),
      ],
    })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Newsletter')).toBeInTheDocument()
      expect(screen.getByText('Sync Data')).toBeInTheDocument()
    })
  })

  it('filters displayed cards by the search query', async () => {
    mockList.mockResolvedValueOnce({
      workflows: [
        makeWorkflowSummary('1', 'Newsletter'),
        makeWorkflowSummary('2', 'Sync Data'),
      ],
    })
    renderPage()
    await waitFor(() => screen.getByText('Newsletter'))

    await userEvent.type(
      screen.getByPlaceholderText('Search workflows…'),
      'sync'
    )

    expect(screen.queryByText('Newsletter')).not.toBeInTheDocument()
    expect(screen.getByText('Sync Data')).toBeInTheDocument()
  })

  it('shows a no-match message when search has no results', async () => {
    mockList.mockResolvedValueOnce({
      workflows: [makeWorkflowSummary('1', 'Newsletter')],
    })
    renderPage()
    await waitFor(() => screen.getByText('Newsletter'))

    await userEvent.type(
      screen.getByPlaceholderText('Search workflows…'),
      'zzz'
    )

    expect(screen.getByText(/no workflows match/i)).toBeInTheDocument()
  })

  it('opens the New Workflow dialog when the header button is clicked', async () => {
    mockList.mockResolvedValueOnce({ workflows: [] })
    renderPage()
    await waitFor(() => screen.getByText('No workflows yet'))

    await userEvent.click(
      screen.getAllByRole('button', { name: /new workflow/i })[0]
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('creates a workflow and navigates to the editor on submit', async () => {
    mockList.mockResolvedValueOnce({ workflows: [] })
    mockCreate.mockResolvedValueOnce({
      workflow: makeWorkflow('new-id', 'My Flow'),
    })
    renderPage()
    await waitFor(() => screen.getByText('No workflows yet'))

    await userEvent.click(
      screen.getAllByRole('button', { name: /new workflow/i })[0]
    )
    await userEvent.type(screen.getByLabelText('Name'), 'My Flow')
    await userEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({ name: 'My Flow' })
      expect(mockNavigate).toHaveBeenCalledWith('/workflows/new-id')
    })
  })
})
