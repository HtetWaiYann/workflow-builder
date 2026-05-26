import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FilterArrayConfig } from '@/components/canvas/NodeConfigForm/FilterArrayConfig'

// Config form for the filter-array node: a single JavaScript expression input.
describe('FilterArrayConfig', () => {
  it('renders the expression input showing the current value', () => {
    render(
      <FilterArrayConfig
        config={{ expression: 'item.active === true' }}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByDisplayValue('item.active === true')).toBeInTheDocument()
  })

  it('renders the Filter expression field label', () => {
    render(<FilterArrayConfig config={{}} onChange={vi.fn()} />)
    expect(screen.getByText('Filter expression')).toBeInTheDocument()
  })

  it('calls onChange with the updated expression when the input changes', () => {
    const onChange = vi.fn()
    render(
      <FilterArrayConfig config={{ expression: '' }} onChange={onChange} />
    )
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'item.price > 100' },
    })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ expression: 'item.price > 100' })
    )
  })

  it('preserves other config fields when onChange is called', () => {
    const onChange = vi.fn()
    render(
      <FilterArrayConfig
        config={{ expression: '', limit: 50 }}
        onChange={onChange}
      />
    )
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'item.active' },
    })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ limit: 50 })
    )
  })
})
