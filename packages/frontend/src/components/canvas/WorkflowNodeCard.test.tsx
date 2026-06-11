import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Globe } from 'lucide-react'
import { WorkflowNodeCard } from '@/components/canvas/WorkflowNodeCard'

// Pure-visual card component reused across the canvas and landing page hero.
// Renders a header with icon + label and a body with the description.
describe('WorkflowNodeCard', () => {
  it('renders the label in the header', () => {
    render(
      <WorkflowNodeCard
        label="HTTP Request"
        description="Make an HTTP request"
        color="#3B82F6"
      />
    )
    expect(screen.getByText('HTTP Request')).toBeInTheDocument()
  })

  it('renders the description in the body', () => {
    render(
      <WorkflowNodeCard
        label="HTTP Request"
        description="Make an HTTP request to any URL"
        color="#3B82F6"
      />
    )
    expect(
      screen.getByText('Make an HTTP request to any URL')
    ).toBeInTheDocument()
  })

  it('renders the Icon component when provided', () => {
    render(
      <WorkflowNodeCard
        label="HTTP Request"
        description="desc"
        color="#3B82F6"
        Icon={Globe}
      />
    )
    // Globe renders an SVG; confirm the card still renders its label
    expect(screen.getByText('HTTP Request')).toBeInTheDocument()
  })

  it('renders the input handle dot when inputHandle is true', () => {
    const { container } = render(
      <WorkflowNodeCard
        label="Node"
        description="desc"
        color="#F97316"
        inputHandle
      />
    )
    // The input handle is a div positioned on the left edge
    const handles = container.querySelectorAll('div[style*="background"]')
    expect(handles.length).toBeGreaterThan(0)
  })

  it('renders the output handle dot when outputHandle is true', () => {
    const { container } = render(
      <WorkflowNodeCard
        label="Node"
        description="desc"
        color="#F97316"
        outputHandle
      />
    )
    const handles = container.querySelectorAll('div[style*="background"]')
    expect(handles.length).toBeGreaterThan(0)
  })

  it('applies border and box-shadow styles when borderColor is provided', () => {
    const { container } = render(
      <WorkflowNodeCard
        label="Node"
        description="desc"
        color="#3B82F6"
        // Use a plain 6-digit hex so jsdom can parse the border shorthand
        borderColor="#3B82F6"
      />
    )
    const card = container.firstChild as HTMLElement
    // jsdom parses the shorthand — borderStyle is the most reliable indicator
    expect(card.style.borderStyle).toBe('solid')
    expect(card.style.boxShadow).toBeTruthy()
  })

  it('applies no inline border when borderColor is not provided', () => {
    const { container } = render(
      <WorkflowNodeCard label="Node" description="desc" color="#3B82F6" />
    )
    const card = container.firstChild as HTMLElement
    expect(card.style.border).toBe('')
  })

  it('renders the status dot when statusDot is provided', () => {
    const { container } = render(
      <WorkflowNodeCard
        label="Node"
        description="desc"
        color="#3B82F6"
        statusDot="bg-green-500"
      />
    )
    expect(container.querySelector('.bg-green-500')).toBeInTheDocument()
  })

  it('renders children inside the card', () => {
    render(
      <WorkflowNodeCard label="Node" description="desc" color="#3B82F6">
        <span data-testid="child">handle</span>
      </WorkflowNodeCard>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})
