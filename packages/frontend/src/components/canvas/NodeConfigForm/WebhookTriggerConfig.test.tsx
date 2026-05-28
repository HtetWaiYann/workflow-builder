import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WebhookTriggerConfig } from '@/components/canvas/NodeConfigForm/WebhookTriggerConfig'

// Config form for the webhook-trigger node: HTTP method select + path input.
describe('WebhookTriggerConfig', () => {
  it('renders the method select showing the current method value', () => {
    render(
      <WebhookTriggerConfig
        config={{ method: 'POST', path: '' }}
        onChange={vi.fn()}
      />
    )
    expect(
      within(screen.getByRole('combobox')).getByText('POST')
    ).toBeInTheDocument()
  })

  it('renders the path input showing the current path value', () => {
    render(
      <WebhookTriggerConfig
        config={{ method: 'POST', path: '/orders' }}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByDisplayValue('/orders')).toBeInTheDocument()
  })

  it('calls onChange with the updated path when the input changes', () => {
    const onChange = vi.fn()
    render(
      <WebhookTriggerConfig
        config={{ method: 'POST', path: '' }}
        onChange={onChange}
      />
    )
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '/new-path' },
    })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ path: '/new-path' })
    )
  })

  it('calls onChange with the updated method when the select changes', async () => {
    const onChange = vi.fn()
    render(
      <WebhookTriggerConfig
        config={{ method: 'POST', path: '' }}
        onChange={onChange}
      />
    )
    fireEvent.keyDown(screen.getByRole('combobox'), { key: ' ' })
    await userEvent.click(await screen.findByRole('option', { name: 'GET' }))
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('preserves other config fields when onChange is called', () => {
    const onChange = vi.fn()
    render(
      <WebhookTriggerConfig
        config={{ method: 'POST', path: '/hook', extra: 'data' }}
        onChange={onChange}
      />
    )
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '/updated' },
    })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ extra: 'data' })
    )
  })
})
