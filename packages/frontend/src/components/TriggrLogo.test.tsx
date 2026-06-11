import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TriggrIcon, TriggrLogo } from '@/components/TriggrLogo'

// Brand identity components: TriggrIcon renders the SVG logo, TriggrLogo combines
// the icon with the wordmark.
describe('TriggrIcon', () => {
  it('renders an image with alt text "Triggr"', () => {
    render(<TriggrIcon />)
    expect(screen.getByAltText('Triggr')).toBeInTheDocument()
  })

  it('applies the default size of 32', () => {
    render(<TriggrIcon />)
    const img = screen.getByAltText('Triggr')
    expect(img).toHaveAttribute('width', '32')
    expect(img).toHaveAttribute('height', '32')
  })

  it('applies a custom size when provided', () => {
    render(<TriggrIcon size={48} />)
    const img = screen.getByAltText('Triggr')
    expect(img).toHaveAttribute('width', '48')
    expect(img).toHaveAttribute('height', '48')
  })
})

describe('TriggrLogo', () => {
  it('renders the logo image', () => {
    render(<TriggrLogo />)
    expect(screen.getByAltText('Triggr')).toBeInTheDocument()
  })

  it('renders the wordmark text', () => {
    render(<TriggrLogo />)
    expect(screen.getByText('Triggr')).toBeInTheDocument()
  })

  it('applies a custom icon size', () => {
    render(<TriggrLogo iconSize={40} />)
    const img = screen.getByAltText('Triggr')
    expect(img).toHaveAttribute('width', '40')
  })
})
