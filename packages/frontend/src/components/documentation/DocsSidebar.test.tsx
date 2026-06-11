import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DocsSidebar } from '@/components/documentation/DocsSidebar'

function renderSidebar(activeId = 'introduction', onSelect = vi.fn()) {
  return render(<DocsSidebar activeId={activeId} onSelect={onSelect} />)
}

// Sidebar navigation for the docs page. Top-level items and collapsible subgroups.
// Active item is highlighted; clicking any item fires onSelect with its id.
describe('DocsSidebar', () => {
  it('renders all section group headings', () => {
    renderSidebar()
    expect(screen.getByText('Getting Started')).toBeInTheDocument()
    expect(screen.getByText('Your Workspace')).toBeInTheDocument()
    expect(screen.getByText('Node Reference')).toBeInTheDocument()
  })

  it('renders top-level leaf items as buttons', () => {
    renderSidebar()
    expect(
      screen.getByRole('button', { name: 'Introduction' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Technology Stack' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Workspaces' })
    ).toBeInTheDocument()
  })

  it('calls onSelect with the correct id when a leaf item is clicked', async () => {
    const onSelect = vi.fn()
    renderSidebar('introduction', onSelect)
    await userEvent.click(
      screen.getByRole('button', { name: 'Technology Stack' })
    )
    expect(onSelect).toHaveBeenCalledWith('tech-stack')
  })

  it('renders subgroup items (e.g. Manual Trigger) expanded by default', () => {
    renderSidebar()
    expect(
      screen.getByRole('button', { name: 'Manual Trigger' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'HTTP Request' })
    ).toBeInTheDocument()
  })

  it('collapses a subgroup when its heading button is clicked', async () => {
    renderSidebar()
    // "Triggers" subgroup heading — the singular leaf items contain "Trigger", not "Triggers"
    const triggersHeading = screen.getByRole('button', { name: /^triggers$/i })
    await userEvent.click(triggersHeading)
    expect(
      screen.queryByRole('button', { name: 'Manual Trigger' })
    ).not.toBeInTheDocument()
  })

  it('re-expands a subgroup on a second click of its heading', async () => {
    renderSidebar()
    const triggersHeading = screen.getByRole('button', { name: /^triggers$/i })
    await userEvent.click(triggersHeading)
    await userEvent.click(triggersHeading)
    expect(
      screen.getByRole('button', { name: 'Manual Trigger' })
    ).toBeInTheDocument()
  })

  it('calls onSelect with the correct id for a subgroup item', async () => {
    const onSelect = vi.fn()
    renderSidebar('introduction', onSelect)
    await userEvent.click(screen.getByRole('button', { name: 'HTTP Request' }))
    expect(onSelect).toHaveBeenCalledWith('http-request')
  })
})
