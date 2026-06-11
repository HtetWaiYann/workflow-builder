import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { NavDivider } from '@/components/NavDivider'

// Pure presentational separator used between nav sections in Navbar and TopBar.
describe('NavDivider', () => {
  it('renders a single divider element', () => {
    const { container } = render(<NavDivider />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders exactly one element', () => {
    const { container } = render(<NavDivider />)
    expect(container.childElementCount).toBe(1)
  })
})
