import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Field } from '@/components/canvas/NodeConfigForm/Field'

// Shared label + children wrapper used by every sub-form component.
describe('Field', () => {
  it('renders the label text', () => {
    render(<Field label="Webhook URL">content</Field>)
    expect(screen.getByText('Webhook URL')).toBeInTheDocument()
  })

  it('renders its children alongside the label', () => {
    render(
      <Field label="URL">
        <input placeholder="https://example.com" />
      </Field>
    )
    expect(
      screen.getByPlaceholderText('https://example.com')
    ).toBeInTheDocument()
  })
})
