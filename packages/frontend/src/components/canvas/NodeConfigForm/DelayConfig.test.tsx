import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DelayConfig } from '@/components/canvas/NodeConfigForm/DelayConfig'

// Config form for the delay node: numeric duration and time-unit select.
describe('DelayConfig', () => {
  it('renders the duration spinbutton showing the current value', () => {
    render(
      <DelayConfig
        config={{ duration: 5, unit: 'minutes' }}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByRole('spinbutton')).toHaveValue(5)
  })

  it('renders the unit select showing the current unit label', () => {
    render(
      <DelayConfig
        config={{ duration: 1, unit: 'minutes' }}
        onChange={vi.fn()}
      />
    )
    expect(
      within(screen.getByRole('combobox')).getByText('Minutes')
    ).toBeInTheDocument()
  })

  it('defaults duration to 1 when the config value is missing', () => {
    render(<DelayConfig config={{}} onChange={vi.fn()} />)
    expect(screen.getByRole('spinbutton')).toHaveValue(1)
  })

  it('calls onChange with the updated duration when the input changes', () => {
    const onChange = vi.fn()
    render(
      <DelayConfig
        config={{ duration: 1, unit: 'seconds' }}
        onChange={onChange}
      />
    )
    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '30' },
    })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ duration: 30 })
    )
  })

  it('calls onChange with the updated unit when the select changes', async () => {
    const onChange = vi.fn()
    render(
      <DelayConfig
        config={{ duration: 1, unit: 'seconds' }}
        onChange={onChange}
      />
    )
    fireEvent.keyDown(screen.getByRole('combobox'), { key: ' ' })
    await userEvent.click(await screen.findByRole('option', { name: 'Hours' }))
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ unit: 'hours' })
    )
  })

  it('preserves other config fields when onChange is called', () => {
    const onChange = vi.fn()
    render(
      <DelayConfig
        config={{ duration: 1, unit: 'seconds', label: 'wait' }}
        onChange={onChange}
      />
    )
    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '10' },
    })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ label: 'wait' })
    )
  })
})
