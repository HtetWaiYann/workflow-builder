import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IfConditionConfig } from '@/components/canvas/NodeConfigForm/IfConditionConfig'

// Config form for the if-condition node: field path, comparison operator, and value.
describe('IfConditionConfig', () => {
  it('renders the field input showing the current value', () => {
    render(
      <IfConditionConfig
        config={{ field: 'data.status', operator: '==', value: '200' }}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByDisplayValue('data.status')).toBeInTheDocument()
  })

  it('renders the operator select showing the current operator label', () => {
    render(
      <IfConditionConfig
        config={{ field: '', operator: '==', value: '' }}
        onChange={vi.fn()}
      />
    )
    expect(
      within(screen.getByRole('combobox')).getByText('equals (==)')
    ).toBeInTheDocument()
  })

  it('renders the value input showing the current value', () => {
    render(
      <IfConditionConfig
        config={{ field: '', operator: '==', value: '200' }}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByDisplayValue('200')).toBeInTheDocument()
  })

  it('calls onChange with the updated field when the field input changes', () => {
    const onChange = vi.fn()
    render(
      <IfConditionConfig
        config={{ field: '', operator: '==', value: '' }}
        onChange={onChange}
      />
    )
    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: 'user.role' } })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ field: 'user.role' })
    )
  })

  it('calls onChange with the updated value when the value input changes', () => {
    const onChange = vi.fn()
    render(
      <IfConditionConfig
        config={{ field: 'x', operator: '==', value: '' }}
        onChange={onChange}
      />
    )
    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[1], { target: { value: 'admin' } })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: 'admin' })
    )
  })

  it('calls onChange with the updated operator when the select changes', async () => {
    const onChange = vi.fn()
    render(
      <IfConditionConfig
        config={{ field: 'x', operator: '==', value: '1' }}
        onChange={onChange}
      />
    )
    fireEvent.keyDown(screen.getByRole('combobox'), { key: ' ' })
    await userEvent.click(
      await screen.findByRole('option', { name: 'not equals (!=)' })
    )
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ operator: '!=' })
    )
  })
})
