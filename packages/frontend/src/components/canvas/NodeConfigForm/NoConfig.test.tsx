import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NoConfig } from '@/components/canvas/NodeConfigForm/NoConfig'

// Placeholder rendered for node types that require no configuration.
describe('NoConfig', () => {
  it('renders the no-configuration message', () => {
    render(<NoConfig />)
    expect(screen.getByText(/no configuration required/i)).toBeInTheDocument()
  })

  it('renders no form inputs', () => {
    render(<NoConfig />)
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByRole('combobox')).toBeNull()
  })
})
