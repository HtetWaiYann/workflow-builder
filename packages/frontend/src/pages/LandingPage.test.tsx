import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LandingPage } from '@/pages/LandingPage'
import { HeroSection } from '@/components/landing/HeroSection'
import { CtaSection } from '@/components/landing/CtaSection'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { RunStripSection } from '@/components/landing/RunStripSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'

// Navbar is a complex auth-aware component tested separately; stub it out so
// landing-page tests stay focused on the marketing content.
vi.mock('@/components/Navbar', () => ({
  Navbar: () => <nav data-testid="navbar" />,
}))

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

// Top-level marketing page composed of Navbar + five content sections.
describe('LandingPage', () => {
  it('renders without crashing', () => {
    wrap(<LandingPage />)
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
  })

  it('includes the hero section headline', () => {
    wrap(<LandingPage />)
    expect(screen.getByText(/Build powerful/i)).toBeInTheDocument()
  })

  it('includes the features section', () => {
    wrap(<LandingPage />)
    expect(screen.getByText(/Visual Editor/i)).toBeInTheDocument()
  })

  it('includes the CTA section', () => {
    wrap(<LandingPage />)
    expect(screen.getByText('Start automating today.')).toBeInTheDocument()
  })

  it('includes the footer copyright notice', () => {
    wrap(<LandingPage />)
    expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument()
  })
})

// Hero section with heading, tagline, and CTA buttons.
describe('HeroSection', () => {
  it('renders the main heading', () => {
    wrap(<HeroSection />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/Build powerful/i)).toBeInTheDocument()
  })

  it('renders the "Get started free" CTA button linking to /register', () => {
    wrap(<HeroSection />)
    const link = screen.getByRole('link', { name: /Get started free/i })
    expect(link).toHaveAttribute('href', '/register')
  })

  it('renders the "Sign in" button linking to /login', () => {
    wrap(<HeroSection />)
    const link = screen.getByRole('link', { name: 'Sign in' })
    expect(link).toHaveAttribute('href', '/login')
  })

  it('renders the tagline paragraph', () => {
    wrap(<HeroSection />)
    expect(screen.getByText(/drag-and-drop canvas/i)).toBeInTheDocument()
  })
})

// CTA section with headline and action buttons.
describe('CtaSection', () => {
  it('renders the section headline', () => {
    wrap(<CtaSection />)
    expect(
      screen.getByRole('heading', { name: 'Start automating today.' })
    ).toBeInTheDocument()
  })

  it('renders the "Create free account" link to /register', () => {
    wrap(<CtaSection />)
    const link = screen.getByRole('link', { name: /Create free account/i })
    expect(link).toHaveAttribute('href', '/register')
  })

  it('renders the "Sign in" link to /login', () => {
    wrap(<CtaSection />)
    const link = screen.getByRole('link', { name: 'Sign in' })
    expect(link).toHaveAttribute('href', '/login')
  })

  it('renders the supporting copy', () => {
    wrap(<CtaSection />)
    expect(screen.getByText(/save hours of manual work/i)).toBeInTheDocument()
  })
})

// Footer with logo and copyright year.
describe('LandingFooter', () => {
  it('renders the Triggr wordmark', () => {
    wrap(<LandingFooter />)
    expect(screen.getByText('Triggr')).toBeInTheDocument()
  })

  it('renders the current year in the copyright line', () => {
    wrap(<LandingFooter />)
    const year = new Date().getFullYear().toString()
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument()
  })

  it('renders the "All rights reserved" text', () => {
    wrap(<LandingFooter />)
    expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument()
  })
})

// Run strip that shows the steps and timing of a sample workflow execution.
describe('RunStripSection', () => {
  it('renders the "Last Run" label', () => {
    wrap(<RunStripSection />)
    expect(screen.getByText(/Last Run/i)).toBeInTheDocument()
  })

  it('renders all four workflow step pills', () => {
    wrap(<RunStripSection />)
    expect(screen.getByText('Webhook Trigger')).toBeInTheDocument()
    expect(screen.getByText('HTTP Request')).toBeInTheDocument()
    expect(screen.getByText('If Condition')).toBeInTheDocument()
    expect(screen.getByText('Send Email')).toBeInTheDocument()
  })

  it('renders timing labels for each step', () => {
    wrap(<RunStripSection />)
    expect(screen.getByText('68ms')).toBeInTheDocument()
    expect(screen.getByText('51ms')).toBeInTheDocument()
  })
})

// Features section with four feature sub-sections.
describe('FeaturesSection', () => {
  it('renders all four feature labels', () => {
    wrap(<FeaturesSection />)
    expect(screen.getByText(/#01 — Visual Editor/i)).toBeInTheDocument()
    expect(screen.getByText(/#02 — Triggers & Actions/i)).toBeInTheDocument()
    expect(screen.getByText(/#03 — Smart Logic/i)).toBeInTheDocument()
    expect(screen.getByText(/#04 — Execution Logs/i)).toBeInTheDocument()
  })

  it('renders feature headings', () => {
    wrap(<FeaturesSection />)
    expect(
      screen.getByText(/A canvas that thinks like a developer/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/React the moment events happen/i)
    ).toBeInTheDocument()
  })

  it('renders the mock trigger list in the Triggers feature', () => {
    wrap(<FeaturesSection />)
    expect(screen.getByText('Webhook trigger')).toBeInTheDocument()
    expect(screen.getByText('Cron schedule')).toBeInTheDocument()
  })

  it('renders the mock execution log rows', () => {
    wrap(<FeaturesSection />)
    expect(screen.getByText('#1042')).toBeInTheDocument()
    expect(screen.getByText('#1041')).toBeInTheDocument()
  })
})
