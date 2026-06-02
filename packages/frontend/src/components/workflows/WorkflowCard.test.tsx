import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WorkflowCard } from '@/components/workflows/WorkflowCard'
import type { WorkflowSummary } from '@workflow-builder/shared'

const fakeWorkflow: WorkflowSummary = {
  id: 'wf-1',
  workspaceId: 'ws-1',
  name: 'Newsletter',
  status: 'ACTIVE',
  runCount: 0,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

const handlers = {
  onOpen: vi.fn(),
  onRename: vi.fn(),
  onDuplicate: vi.fn(),
  onActivate: vi.fn(),
  onDeactivate: vi.fn(),
  onDelete: vi.fn(),
  onViewHistory: vi.fn(),
}

function renderCard(overrides: Partial<WorkflowSummary> = {}, isOwner = true) {
  return render(
    <WorkflowCard
      workflow={{ ...fakeWorkflow, ...overrides }}
      isOwner={isOwner}
      {...handlers}
    />
  )
}

beforeEach(() => vi.clearAllMocks())

// Card displayed in the dashboard grid. Clicking the card body opens the
// workflow editor; the kebab menu surfaces secondary actions without navigation.
describe('WorkflowCard', () => {
  it('renders the workflow name and status label', () => {
    renderCard()
    expect(screen.getByText('Newsletter')).toBeInTheDocument()
    expect(screen.getByText('active')).toBeInTheDocument()
  })

  it('calls onOpen with the workflow id when the card body is clicked', async () => {
    renderCard()
    await userEvent.click(screen.getByText('Newsletter'))
    expect(handlers.onOpen).toHaveBeenCalledWith('wf-1')
  })

  it('shows Deactivate in the menu for an active workflow', async () => {
    renderCard({ status: 'ACTIVE' })
    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Deactivate')).toBeInTheDocument()
    expect(screen.queryByText('Activate')).not.toBeInTheDocument()
  })

  it('shows Activate in the menu for an inactive workflow', async () => {
    renderCard({ status: 'INACTIVE' })
    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Activate')).toBeInTheDocument()
    expect(screen.queryByText('Deactivate')).not.toBeInTheDocument()
  })

  it('calls onDelete when Delete is selected from the menu', async () => {
    renderCard()
    await userEvent.click(screen.getByRole('button'))
    await userEvent.click(screen.getByText('Delete'))
    expect(handlers.onDelete).toHaveBeenCalledWith('wf-1')
    expect(handlers.onOpen).not.toHaveBeenCalled()
  })

  it('calls onRename when Rename is selected from the menu', async () => {
    renderCard()
    await userEvent.click(screen.getByRole('button'))
    await userEvent.click(screen.getByText('Rename'))
    expect(handlers.onRename).toHaveBeenCalledWith(fakeWorkflow)
  })

  it('calls onViewHistory when "Run History" is selected from the menu', async () => {
    renderCard()
    await userEvent.click(screen.getByRole('button'))
    await userEvent.click(screen.getByText('Run History'))
    expect(handlers.onViewHistory).toHaveBeenCalledWith('wf-1')
    expect(handlers.onOpen).not.toHaveBeenCalled()
  })

  it('hides Delete from the menu when the user is not an owner', async () => {
    renderCard({}, false)
    await userEvent.click(screen.getByRole('button'))
    expect(screen.queryByText('Delete')).not.toBeInTheDocument()
  })
})
