import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorConfigForm } from '@/components/canvas/NodeConfigForm/ErrorConfigForm'

// Per-node error handling form that controls the failure policy (stop, continue,
// retry) and an optional error output handle toggle.
describe('ErrorConfigForm', () => {
  it('renders the On error select with stop as the default', () => {
    render(<ErrorConfigForm errorConfig={{}} onChange={vi.fn()} />)
    expect(screen.getByText('Stop workflow')).toBeInTheDocument()
  })

  it('does not show retry fields when policy is stop', () => {
    render(
      <ErrorConfigForm errorConfig={{ policy: 'stop' }} onChange={vi.fn()} />
    )
    expect(screen.queryByLabelText(/retry attempts/i)).not.toBeInTheDocument()
  })

  it('shows retry attempt and delay fields when policy is retry', () => {
    render(
      <ErrorConfigForm errorConfig={{ policy: 'retry' }} onChange={vi.fn()} />
    )
    // Field wraps Label without htmlFor — check by text instead of label-for association
    expect(screen.getByText('Retry attempts')).toBeInTheDocument()
    expect(screen.getByText('Delay between retries (ms)')).toBeInTheDocument()
  })

  it('calls onChange when the error branch checkbox is toggled', async () => {
    const onChange = vi.fn()
    render(<ErrorConfigForm errorConfig={{}} onChange={onChange} />)
    await userEvent.click(screen.getByLabelText('Enable error output handle'))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ errorBranch: true })
    )
  })

  it('shows the error handle info text when errorBranch is enabled', () => {
    render(
      <ErrorConfigForm errorConfig={{ errorBranch: true }} onChange={vi.fn()} />
    )
    expect(
      screen.getByText(/A red handle appears at the bottom/i)
    ).toBeInTheDocument()
  })

  it('hides the error handle info text when errorBranch is disabled', () => {
    render(
      <ErrorConfigForm
        errorConfig={{ errorBranch: false }}
        onChange={vi.fn()}
      />
    )
    expect(
      screen.queryByText(/A red handle appears at the bottom/i)
    ).not.toBeInTheDocument()
  })

  it('calls onChange with patched retryCount when retry count input changes', async () => {
    const onChange = vi.fn()
    render(
      <ErrorConfigForm
        errorConfig={{ policy: 'retry', retryCount: 1, retryDelayMs: 1000 }}
        onChange={onChange}
      />
    )
    // Field doesn't link label to input via htmlFor — find the spinbutton by index.
    // fireEvent.change is used here because userEvent cannot reliably replace
    // the value of a controlled number input whose prop doesn't change between renders.
    const inputs = screen.getAllByRole('spinbutton')
    fireEvent.change(inputs[0], { target: { value: '3' } })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ retryCount: 3 })
    )
  })
})
