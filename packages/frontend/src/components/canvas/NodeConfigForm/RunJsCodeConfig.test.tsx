import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RunJsCodeConfig } from '@/components/canvas/NodeConfigForm/RunJsCodeConfig'

// Config form for the run-js-code node: a single monospace code textarea.
describe('RunJsCodeConfig', () => {
  it('renders the code textarea showing the current value', () => {
    render(
      <RunJsCodeConfig config={{ code: 'return {};' }} onChange={vi.fn()} />
    )
    expect(screen.getByDisplayValue('return {};')).toBeInTheDocument()
  })

  it('renders the Code field label', () => {
    render(<RunJsCodeConfig config={{}} onChange={vi.fn()} />)
    expect(screen.getByText('Code')).toBeInTheDocument()
  })

  it('calls onChange with the updated code when the textarea changes', () => {
    const onChange = vi.fn()
    render(<RunJsCodeConfig config={{ code: '' }} onChange={onChange} />)
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'return { ok: true };' },
    })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ code: 'return { ok: true };' })
    )
  })

  it('preserves other config fields when onChange is called', () => {
    const onChange = vi.fn()
    render(
      <RunJsCodeConfig
        config={{ code: '', timeout: 5000 }}
        onChange={onChange}
      />
    )
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'return 1;' },
    })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ timeout: 5000 })
    )
  })
})
