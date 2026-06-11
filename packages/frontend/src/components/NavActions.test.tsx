import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { NavActions } from '@/components/NavActions'

function renderNavActions() {
  return render(
    <MemoryRouter>
      <NavActions />
    </MemoryRouter>
  )
}

// Shared action group (Docs link + divider + theme toggle) rendered in both
// the public Navbar and the authenticated TopBar.
describe('NavActions', () => {
  it('renders a Docs link pointing to /docs', () => {
    renderNavActions()
    const link = screen.getByRole('link', { name: 'Docs' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/docs')
  })

  it('renders the theme toggle button', () => {
    renderNavActions()
    expect(
      screen.getByRole('button', { name: 'Change theme' })
    ).toBeInTheDocument()
  })
})
