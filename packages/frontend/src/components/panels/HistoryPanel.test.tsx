import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HistoryPanel } from '@/components/panels/HistoryPanel'
import { useExecutionStore } from '@/stores/executionStore'
import type { ExecutionSummary } from '@triggr/shared'

const fakeSummary: ExecutionSummary = {
  id: 'exec-1',
  workflowId: 'wf-1',
  status: 'SUCCESS',
  inputData: null,
  createdAt: '2024-06-01T10:00:00.000Z',
  startedAt: '2024-06-01T10:00:00.000Z',
  finishedAt: '2024-06-01T10:00:00.500Z',
}

function renderPanel(props: { workflowName?: string } = {}) {
  return render(<HistoryPanel {...props} />)
}

// Right-side slide-in panel for run history. Shows a list of execution summaries
// and drills into a per-node detail view when a row is clicked.
describe('HistoryPanel', () => {
  beforeEach(() => {
    useExecutionStore.setState({
      showHistoryPanel: false,
      recentExecutions: [],
      historyExecution: null,
      isLoadingHistoryDetail: false,
    })
  })

  it('renders the panel element even when hidden', () => {
    renderPanel()
    expect(
      screen.getByRole('dialog', { name: 'Run history' })
    ).toBeInTheDocument()
  })

  it('is visually hidden (translated off screen) when showHistoryPanel is false', () => {
    renderPanel()
    const panel = screen.getByRole('dialog', { name: 'Run history' })
    expect(panel.className).toContain('translate-x-full')
  })

  it('is visible when showHistoryPanel is true', () => {
    useExecutionStore.setState({ showHistoryPanel: true })
    renderPanel()
    const panel = screen.getByRole('dialog', { name: 'Run history' })
    expect(panel.className).toContain('translate-x-0')
  })

  it('shows "No runs yet." when the execution list is empty', () => {
    useExecutionStore.setState({ showHistoryPanel: true })
    renderPanel()
    expect(screen.getByText('No runs yet.')).toBeInTheDocument()
  })

  it('shows the workflow name in the header when provided', () => {
    useExecutionStore.setState({ showHistoryPanel: true })
    renderPanel({ workflowName: 'My Flow' })
    expect(screen.getByText('Run History — My Flow')).toBeInTheDocument()
  })

  it('falls back to generic "Run History" header when no workflow name', () => {
    useExecutionStore.setState({ showHistoryPanel: true })
    renderPanel()
    expect(screen.getByText('Run History')).toBeInTheDocument()
  })

  it('renders a row for each execution summary', () => {
    useExecutionStore.setState({
      showHistoryPanel: true,
      recentExecutions: [
        fakeSummary,
        { ...fakeSummary, id: 'exec-2', status: 'ERROR' },
      ],
    })
    renderPanel()
    expect(screen.getByText('Success')).toBeInTheDocument()
    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('calls closeHistoryPanel when the close button is clicked', async () => {
    useExecutionStore.setState({ showHistoryPanel: true })
    renderPanel()
    await userEvent.click(
      screen.getByRole('button', { name: 'Close history panel' })
    )
    expect(useExecutionStore.getState().showHistoryPanel).toBe(false)
  })

  it('calls closeHistoryPanel when the backdrop is clicked', async () => {
    useExecutionStore.setState({ showHistoryPanel: true })
    const { container } = renderPanel()
    const backdrop = container.querySelector(
      '[aria-hidden="true"]'
    ) as HTMLElement
    await userEvent.click(backdrop)
    expect(useExecutionStore.getState().showHistoryPanel).toBe(false)
  })

  it('shows the loading indicator when isLoadingHistoryDetail is true', () => {
    useExecutionStore.setState({
      showHistoryPanel: true,
      isLoadingHistoryDetail: true,
    })
    renderPanel()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })
})
