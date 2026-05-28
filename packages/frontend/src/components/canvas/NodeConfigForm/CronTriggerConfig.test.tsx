import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CronTriggerConfig } from '@/components/canvas/NodeConfigForm/CronTriggerConfig'

// Config form for the cron-trigger node: a single cron expression input.
describe('CronTriggerConfig', () => {
  it('renders the schedule input showing the current value', () => {
    render(
      <CronTriggerConfig
        config={{ schedule: '0 9 * * *' }}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByDisplayValue('0 9 * * *')).toBeInTheDocument()
  })

  it('renders the Schedule field label', () => {
    render(<CronTriggerConfig config={{}} onChange={vi.fn()} />)
    expect(screen.getByText('Schedule')).toBeInTheDocument()
  })

  it('calls onChange with the updated schedule when the input changes', () => {
    const onChange = vi.fn()
    render(<CronTriggerConfig config={{ schedule: '' }} onChange={onChange} />)
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '0 9 * * 1-5' },
    })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ schedule: '0 9 * * 1-5' })
    )
  })

  it('preserves other config fields when onChange is called', () => {
    const onChange = vi.fn()
    render(
      <CronTriggerConfig
        config={{ schedule: '', timezone: 'UTC' }}
        onChange={onChange}
      />
    )
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '* * * * *' },
    })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ timezone: 'UTC' })
    )
  })
})
