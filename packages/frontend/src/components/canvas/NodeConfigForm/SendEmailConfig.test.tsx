import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SendEmailConfig } from '@/components/canvas/NodeConfigForm/SendEmailConfig'

// Config form for the send-email node: recipient, subject, and body fields.
describe('SendEmailConfig', () => {
  it('renders the To, Subject, and Body field labels', () => {
    render(
      <SendEmailConfig
        config={{ to: '', subject: '', body: '' }}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByText('To')).toBeInTheDocument()
    expect(screen.getByText('Subject')).toBeInTheDocument()
    expect(screen.getByText('Body')).toBeInTheDocument()
  })

  it('renders all three inputs showing their current values', () => {
    render(
      <SendEmailConfig
        config={{ to: 'a@b.com', subject: 'Hello', body: 'World' }}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByDisplayValue('a@b.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Hello')).toBeInTheDocument()
    expect(screen.getByDisplayValue('World')).toBeInTheDocument()
  })

  it('calls onChange with the updated to address when the input changes', () => {
    const onChange = vi.fn()
    render(
      <SendEmailConfig
        config={{ to: '', subject: '', body: '' }}
        onChange={onChange}
      />
    )
    fireEvent.change(screen.getByPlaceholderText('recipient@example.com'), {
      target: { value: 'user@example.com' },
    })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ to: 'user@example.com' })
    )
  })

  it('calls onChange with the updated subject when the input changes', () => {
    const onChange = vi.fn()
    render(
      <SendEmailConfig
        config={{ to: '', subject: '', body: '' }}
        onChange={onChange}
      />
    )
    fireEvent.change(screen.getByPlaceholderText('Email subject'), {
      target: { value: 'Order confirmed' },
    })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ subject: 'Order confirmed' })
    )
  })

  it('calls onChange with the updated body when the textarea changes', () => {
    const onChange = vi.fn()
    render(
      <SendEmailConfig
        config={{ to: '', subject: '', body: '' }}
        onChange={onChange}
      />
    )
    fireEvent.change(screen.getByPlaceholderText('Email body...'), {
      target: { value: 'Your order has shipped.' },
    })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ body: 'Your order has shipped.' })
    )
  })
})
