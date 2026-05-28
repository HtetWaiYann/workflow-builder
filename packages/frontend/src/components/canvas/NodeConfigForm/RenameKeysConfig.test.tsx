import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RenameKeysConfig } from '@/components/canvas/NodeConfigForm/RenameKeysConfig'

// Config form for the rename-keys node: a dynamic list of from→to key mappings.
describe('RenameKeysConfig', () => {
  it('renders each mapping row with its from and to inputs', () => {
    render(
      <RenameKeysConfig
        config={{ mappings: [{ from: 'userId', to: 'id' }] }}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByDisplayValue('userId')).toBeInTheDocument()
    expect(screen.getByDisplayValue('id')).toBeInTheDocument()
  })

  it('renders no inputs when the mappings list is empty', () => {
    render(<RenameKeysConfig config={{ mappings: [] }} onChange={vi.fn()} />)
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('calls onChange with a new empty mapping appended when Add mapping is clicked', async () => {
    const onChange = vi.fn()
    render(<RenameKeysConfig config={{ mappings: [] }} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /add mapping/i }))
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ mappings: [{ from: '', to: '' }] })
    )
  })

  it('calls onChange with the first mapping removed when its remove button is clicked', async () => {
    const onChange = vi.fn()
    render(
      <RenameKeysConfig
        config={{
          mappings: [
            { from: 'a', to: 'b' },
            { from: 'c', to: 'd' },
          ],
        }}
        onChange={onChange}
      />
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Remove mapping 1' })
    )
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ mappings: [{ from: 'c', to: 'd' }] })
    )
  })

  it('calls onChange with the updated from value when the from input changes', () => {
    const onChange = vi.fn()
    render(
      <RenameKeysConfig
        config={{ mappings: [{ from: 'old', to: 'new' }] }}
        onChange={onChange}
      />
    )
    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: 'updated' } })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        mappings: [{ from: 'updated', to: 'new' }],
      })
    )
  })
})
