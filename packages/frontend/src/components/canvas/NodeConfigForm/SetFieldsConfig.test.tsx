import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SetFieldsConfig } from '@/components/canvas/NodeConfigForm/SetFieldsConfig'

// Config form for the set-fields node: a dynamic list of key→value pairs to set on the data object.
describe('SetFieldsConfig', () => {
  it('renders each field row with its key and value inputs', () => {
    render(
      <SetFieldsConfig
        config={{ fields: [{ key: 'status', value: '"active"' }] }}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByDisplayValue('status')).toBeInTheDocument()
    expect(screen.getByDisplayValue('"active"')).toBeInTheDocument()
  })

  it('renders no inputs when the fields list is empty', () => {
    render(<SetFieldsConfig config={{ fields: [] }} onChange={vi.fn()} />)
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('calls onChange with a new empty field appended when Add field is clicked', async () => {
    const onChange = vi.fn()
    render(<SetFieldsConfig config={{ fields: [] }} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /add field/i }))
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ fields: [{ key: '', value: '' }] })
    )
  })

  it('calls onChange with the first field removed when its remove button is clicked', async () => {
    const onChange = vi.fn()
    render(
      <SetFieldsConfig
        config={{
          fields: [
            { key: 'a', value: '1' },
            { key: 'b', value: '2' },
          ],
        }}
        onChange={onChange}
      />
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Remove field 1' })
    )
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ fields: [{ key: 'b', value: '2' }] })
    )
  })

  it('calls onChange with the updated key when a key input changes', () => {
    const onChange = vi.fn()
    render(
      <SetFieldsConfig
        config={{ fields: [{ key: 'old', value: 'v' }] }}
        onChange={onChange}
      />
    )
    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: 'newKey' } })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        fields: [{ key: 'newKey', value: 'v' }],
      })
    )
  })
})
