import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingScreen } from '@/components/LoadingScreen'

// Full-screen loading placeholder shown while the auth session is being resolved.
describe('LoadingScreen', () => {
  it('renders a status landmark for accessibility', () => {
    render(<LoadingScreen />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('displays the Triggr brand name', () => {
    render(<LoadingScreen />)
    expect(screen.getByText('Triggr')).toBeInTheDocument()
  })

  it('renders the logo image with an accessible alt attribute', () => {
    render(<LoadingScreen />)
    const img = screen.getByAltText('Triggr')
    expect(img).toBeInTheDocument()
  })
})
