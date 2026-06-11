import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NodeDocsButton } from '@/components/canvas/NodeDocs'

// Info button that opens a dialog with usage docs and examples for a node type.
describe('NodeDocsButton', () => {
  it('renders an info button with an accessible label', () => {
    render(
      <NodeDocsButton nodeType="webhook-trigger" nodeLabel="Webhook Trigger" />
    )
    expect(
      screen.getByRole('button', { name: 'View documentation' })
    ).toBeInTheDocument()
  })

  it('opens the dialog with the node label as title when clicked', async () => {
    render(
      <NodeDocsButton nodeType="webhook-trigger" nodeLabel="Webhook Trigger" />
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'View documentation' })
    )
    expect(
      screen.getByRole('heading', { name: 'Webhook Trigger' })
    ).toBeInTheDocument()
  })

  it('shows the node description inside the dialog', async () => {
    render(
      <NodeDocsButton nodeType="webhook-trigger" nodeLabel="Webhook Trigger" />
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'View documentation' })
    )
    expect(
      screen.getByText(/Listens for an incoming HTTP request/i)
    ).toBeInTheDocument()
  })

  it('renders field documentation for nodes that have fields', async () => {
    render(
      <NodeDocsButton nodeType="if-condition" nodeLabel="If / Condition" />
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'View documentation' })
    )
    expect(screen.getByText('Fields')).toBeInTheDocument()
    expect(screen.getByText('Field')).toBeInTheDocument()
  })

  it('renders example documentation when examples exist', async () => {
    render(<NodeDocsButton nodeType="cron-trigger" nodeLabel="Cron Trigger" />)
    await userEvent.click(
      screen.getByRole('button', { name: 'View documentation' })
    )
    expect(screen.getByText('Examples')).toBeInTheDocument()
    expect(screen.getByText('Every minute')).toBeInTheDocument()
  })

  it('works for a node with no fields (manual-trigger)', async () => {
    render(
      <NodeDocsButton nodeType="manual-trigger" nodeLabel="Manual Trigger" />
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'View documentation' })
    )
    expect(
      screen.getByText(/Starts the workflow on demand/i)
    ).toBeInTheDocument()
    expect(screen.queryByText('Fields')).not.toBeInTheDocument()
  })
})
