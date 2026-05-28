import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SwitchConfig } from '@/components/canvas/NodeConfigForm/SwitchConfig'

// Config form for the switch node: field path and a dynamic list of value→label cases.
describe('SwitchConfig', () => {
  it('renders the field input showing the current value', () => {
    render(
      <SwitchConfig
        config={{ field: 'data.type', cases: [] }}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByDisplayValue('data.type')).toBeInTheDocument()
  })

  it('renders each case row with its value and label inputs', () => {
    render(
      <SwitchConfig
        config={{
          field: '',
          cases: [{ value: 'pending', label: 'Pending' }],
        }}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByDisplayValue('pending')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Pending')).toBeInTheDocument()
  })

  it('calls onChange with the updated field when the field input changes', () => {
    const onChange = vi.fn()
    render(
      <SwitchConfig config={{ field: '', cases: [] }} onChange={onChange} />
    )
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'order.status' },
    })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ field: 'order.status' })
    )
  })

  it('calls onChange with a new empty case appended when Add case is clicked', async () => {
    const onChange = vi.fn()
    render(
      <SwitchConfig config={{ field: '', cases: [] }} onChange={onChange} />
    )
    await userEvent.click(screen.getByRole('button', { name: /add case/i }))
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ cases: [{ value: '', label: '' }] })
    )
  })

  it('calls onChange with the first case removed when its remove button is clicked', async () => {
    const onChange = vi.fn()
    render(
      <SwitchConfig
        config={{
          field: '',
          cases: [
            { value: 'a', label: 'A' },
            { value: 'b', label: 'B' },
          ],
        }}
        onChange={onChange}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Remove case 1' }))
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ cases: [{ value: 'b', label: 'B' }] })
    )
  })

  it('renders a remove button for each case row', () => {
    render(
      <SwitchConfig
        config={{
          field: '',
          cases: [
            { value: 'x', label: 'X' },
            { value: 'y', label: 'Y' },
          ],
        }}
        onChange={vi.fn()}
      />
    )
    expect(
      screen.getByRole('button', { name: 'Remove case 1' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Remove case 2' })
    ).toBeInTheDocument()
  })
})
