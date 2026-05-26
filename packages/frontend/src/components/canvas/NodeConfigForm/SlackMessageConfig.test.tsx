import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SlackMessageConfig } from '@/components/canvas/NodeConfigForm/SlackMessageConfig'

// Config form for the slack-message node: webhook URL input and message textarea.
describe('SlackMessageConfig', () => {
  it('renders the webhook URL input showing the current value', () => {
    render(
      <SlackMessageConfig
        config={{
          webhookUrl: 'https://hooks.slack.com/services/abc',
          message: '',
        }}
        onChange={vi.fn()}
      />
    )
    expect(
      screen.getByDisplayValue('https://hooks.slack.com/services/abc')
    ).toBeInTheDocument()
  })

  it('renders the message textarea showing the current value', () => {
    render(
      <SlackMessageConfig
        config={{ webhookUrl: '', message: 'Deploy complete!' }}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByDisplayValue('Deploy complete!')).toBeInTheDocument()
  })

  it('calls onChange with the updated webhookUrl when the URL input changes', () => {
    const onChange = vi.fn()
    render(
      <SlackMessageConfig
        config={{ webhookUrl: '', message: '' }}
        onChange={onChange}
      />
    )
    fireEvent.change(
      screen.getByPlaceholderText('https://hooks.slack.com/services/...'),
      { target: { value: 'https://hooks.slack.com/services/xyz' } }
    )
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        webhookUrl: 'https://hooks.slack.com/services/xyz',
      })
    )
  })

  it('calls onChange with the updated message when the textarea changes', () => {
    const onChange = vi.fn()
    render(
      <SlackMessageConfig
        config={{ webhookUrl: '', message: '' }}
        onChange={onChange}
      />
    )
    fireEvent.change(screen.getByPlaceholderText('Your message here...'), {
      target: { value: 'Deployment complete!' },
    })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: 'Deployment complete!' })
    )
  })
})
