import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NodePalette } from '@/components/canvas/NodePalette'

beforeEach(() => vi.clearAllMocks())

describe('NodePalette', () => {
  it('renders all 5 group headers', () => {
    render(<NodePalette />)
    expect(screen.getByText('Triggers')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
    expect(screen.getByText('Logic')).toBeInTheDocument()
    expect(screen.getByText('Transform')).toBeInTheDocument()
    expect(screen.getByText('Notify')).toBeInTheDocument()
  })

  it('renders node items inside their group', () => {
    render(<NodePalette />)
    expect(screen.getByText('Manual Trigger')).toBeInTheDocument()
    expect(screen.getByText('Webhook Trigger')).toBeInTheDocument()
    expect(screen.getByText('HTTP Request')).toBeInTheDocument()
    expect(screen.getByText('Slack Message')).toBeInTheDocument()
  })

  it('filters nodes by label when searching', async () => {
    render(<NodePalette />)
    await userEvent.type(screen.getByPlaceholderText('Search nodes...'), 'cron')
    expect(screen.getByText('Cron Trigger')).toBeInTheDocument()
    expect(screen.queryByText('Manual Trigger')).not.toBeInTheDocument()
    expect(screen.queryByText('HTTP Request')).not.toBeInTheDocument()
  })

  it('filters nodes by description when searching', async () => {
    render(<NodePalette />)
    await userEvent.type(
      screen.getByPlaceholderText('Search nodes...'),
      'schedule'
    )
    expect(screen.getByText('Cron Trigger')).toBeInTheDocument()
  })

  it('shows no items when search matches nothing', async () => {
    render(<NodePalette />)
    await userEvent.type(
      screen.getByPlaceholderText('Search nodes...'),
      'zzznomatch'
    )
    expect(screen.queryByText('Manual Trigger')).not.toBeInTheDocument()
    expect(screen.queryByText('HTTP Request')).not.toBeInTheDocument()
  })

  it('collapses a group when its header is clicked', async () => {
    render(<NodePalette />)
    const triggersButton = screen.getByRole('button', { name: /triggers/i })
    await userEvent.click(triggersButton)
    expect(screen.queryByText('Manual Trigger')).not.toBeInTheDocument()
    expect(screen.queryByText('Webhook Trigger')).not.toBeInTheDocument()
  })

  it('expands a collapsed group on second click', async () => {
    render(<NodePalette />)
    const triggersButton = screen.getByRole('button', { name: /triggers/i })
    await userEvent.click(triggersButton)
    await userEvent.click(triggersButton)
    expect(screen.getByText('Manual Trigger')).toBeInTheDocument()
  })

  it('keeps other groups visible when one is collapsed', async () => {
    render(<NodePalette />)
    await userEvent.click(screen.getByRole('button', { name: /triggers/i }))
    expect(screen.getByText('HTTP Request')).toBeInTheDocument()
    expect(screen.getByText('If / Condition')).toBeInTheDocument()
  })

  it('shows all items regardless of collapsed state when searching', async () => {
    render(<NodePalette />)
    await userEvent.click(screen.getByRole('button', { name: /triggers/i }))
    expect(screen.queryByText('Manual Trigger')).not.toBeInTheDocument()
    await userEvent.type(
      screen.getByPlaceholderText('Search nodes...'),
      'trigger'
    )
    expect(screen.getByText('Manual Trigger')).toBeInTheDocument()
    expect(screen.getByText('Webhook Trigger')).toBeInTheDocument()
  })

  it('each non-collapsed item is draggable', () => {
    render(<NodePalette />)
    const item = screen.getByText('Manual Trigger').closest('[draggable]')
    expect(item).toHaveAttribute('draggable', 'true')
  })

  it('shows group headers as buttons for accessibility', () => {
    render(<NodePalette />)
    const buttons = screen.getAllByRole('button')
    const groupButtons = buttons.filter((b) =>
      ['Triggers', 'Actions', 'Logic', 'Transform', 'Notify'].some((g) =>
        within(b).queryByText(g)
      )
    )
    expect(groupButtons).toHaveLength(5)
  })
})
