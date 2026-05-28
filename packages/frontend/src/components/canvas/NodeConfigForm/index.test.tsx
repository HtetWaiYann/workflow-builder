import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NodeConfigForm } from '@/components/canvas/NodeConfigForm'

// Verifies that NodeConfigForm routes each nodeType to the correct sub-component.
// Behaviour of each sub-component is tested in its own co-located test file.
describe('NodeConfigForm', () => {
  describe('routing to NoConfig', () => {
    it('renders the no-config message for manual-trigger', () => {
      render(
        <NodeConfigForm
          nodeType="manual-trigger"
          config={{}}
          onChange={vi.fn()}
        />
      )
      expect(screen.getByText(/no configuration required/i)).toBeInTheDocument()
    })

    it('renders the no-config message for merge', () => {
      render(<NodeConfigForm nodeType="merge" config={{}} onChange={vi.fn()} />)
      expect(screen.getByText(/no configuration required/i)).toBeInTheDocument()
    })
  })

  describe('routing to trigger configs', () => {
    it('renders the method select and path input for webhook-trigger', () => {
      render(
        <NodeConfigForm
          nodeType="webhook-trigger"
          config={{ method: 'POST', path: '' }}
          onChange={vi.fn()}
        />
      )
      expect(screen.getByRole('combobox')).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('renders the schedule input for cron-trigger', () => {
      render(
        <NodeConfigForm
          nodeType="cron-trigger"
          config={{ schedule: '' }}
          onChange={vi.fn()}
        />
      )
      expect(screen.getByText('Schedule')).toBeInTheDocument()
    })
  })

  describe('routing to action configs', () => {
    it('renders the URL input for http-request', () => {
      render(
        <NodeConfigForm
          nodeType="http-request"
          config={{ method: 'GET', url: '', headers: '' }}
          onChange={vi.fn()}
        />
      )
      expect(
        screen.getByPlaceholderText('https://api.example.com/endpoint')
      ).toBeInTheDocument()
    })

    it('renders the code textarea for run-js-code', () => {
      render(
        <NodeConfigForm
          nodeType="run-js-code"
          config={{ code: '' }}
          onChange={vi.fn()}
        />
      )
      expect(screen.getByText('Code')).toBeInTheDocument()
    })

    it('renders the webhook URL input for slack-message', () => {
      render(
        <NodeConfigForm
          nodeType="slack-message"
          config={{ webhookUrl: '', message: '' }}
          onChange={vi.fn()}
        />
      )
      expect(screen.getByText('Webhook URL')).toBeInTheDocument()
    })

    it('renders the subject input for send-email', () => {
      render(
        <NodeConfigForm
          nodeType="send-email"
          config={{ to: '', subject: '', body: '' }}
          onChange={vi.fn()}
        />
      )
      expect(screen.getByText('Subject')).toBeInTheDocument()
    })

    it('renders the duration input for delay', () => {
      render(
        <NodeConfigForm
          nodeType="delay"
          config={{ duration: 1, unit: 'seconds' }}
          onChange={vi.fn()}
        />
      )
      expect(screen.getByRole('spinbutton')).toBeInTheDocument()
    })
  })

  describe('routing to logic configs', () => {
    it('renders the operator select for if-condition', () => {
      render(
        <NodeConfigForm
          nodeType="if-condition"
          config={{ field: '', operator: '==', value: '' }}
          onChange={vi.fn()}
        />
      )
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('renders the Add case button for switch', () => {
      render(
        <NodeConfigForm
          nodeType="switch"
          config={{ field: '', cases: [] }}
          onChange={vi.fn()}
        />
      )
      expect(
        screen.getByRole('button', { name: /add case/i })
      ).toBeInTheDocument()
    })
  })

  describe('routing to transform configs', () => {
    it('renders the Add field button for set-fields', () => {
      render(
        <NodeConfigForm
          nodeType="set-fields"
          config={{ fields: [] }}
          onChange={vi.fn()}
        />
      )
      expect(
        screen.getByRole('button', { name: /add field/i })
      ).toBeInTheDocument()
    })

    it('renders the expression input for filter-array', () => {
      render(
        <NodeConfigForm
          nodeType="filter-array"
          config={{ expression: '' }}
          onChange={vi.fn()}
        />
      )
      expect(screen.getByText('Filter expression')).toBeInTheDocument()
    })

    it('renders the Add mapping button for rename-keys', () => {
      render(
        <NodeConfigForm
          nodeType="rename-keys"
          config={{ mappings: [] }}
          onChange={vi.fn()}
        />
      )
      expect(
        screen.getByRole('button', { name: /add mapping/i })
      ).toBeInTheDocument()
    })
  })
})
