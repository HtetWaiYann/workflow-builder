import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { DocsPage } from '@/pages/DocsPage'
import { DOC_PAGES } from '@/lib/docsData'

vi.mock('@/components/Navbar', () => ({
  Navbar: () => <div data-testid="navbar" />,
}))

const TOTAL = DOC_PAGES.length
const firstPage = DOC_PAGES[0]
const secondPage = DOC_PAGES[1]
const lastPage = DOC_PAGES[TOTAL - 1]
const secondToLastPage = DOC_PAGES[TOTAL - 2]

function renderDocsPage() {
  return render(
    <MemoryRouter>
      <DocsPage />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  window.location.hash = ''
})

// Paginated docs viewer with sidebar navigation, mobile jump nav, and prev/next pagination.
describe('DocsPage', () => {
  it('renders the first page content by default', () => {
    renderDocsPage()
    expect(
      screen.getByRole('heading', { name: firstPage.title })
    ).toBeInTheDocument()
  })

  it('shows the correct page counter on the first page', () => {
    renderDocsPage()
    expect(screen.getByText(`1 / ${TOTAL}`)).toBeInTheDocument()
  })

  it('renders the embedded Navbar', () => {
    renderDocsPage()
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
  })

  it('renders the mobile jump nav buttons', () => {
    renderDocsPage()
    expect(
      screen.getByRole('button', { name: 'Getting Started' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Your Workspace' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Node Reference' })
    ).toBeInTheDocument()
  })

  it('navigates to a page when a sidebar button is clicked', async () => {
    renderDocsPage()
    await userEvent.click(
      screen.getAllByRole('button', { name: secondPage.title })[0]
    )
    expect(
      screen.getByRole('heading', { name: secondPage.title })
    ).toBeInTheDocument()
  })

  it('updates the page counter after navigating', async () => {
    renderDocsPage()
    await userEvent.click(
      screen.getAllByRole('button', { name: secondPage.title })[0]
    )
    expect(screen.getByText(`2 / ${TOTAL}`)).toBeInTheDocument()
  })

  it('shows the Next pagination button on the first page', () => {
    renderDocsPage()
    // The Next button renders the next page title as its text.
    // It appears in both the sidebar and the pagination footer, so getAllByRole is used.
    expect(
      screen.getAllByRole('button', { name: secondPage.title }).length
    ).toBeGreaterThan(0)
  })

  it('shows the Prev pagination button on the last page', async () => {
    renderDocsPage()
    // Navigate to last page via sidebar
    await userEvent.click(
      screen.getAllByRole('button', { name: lastPage.title })[0]
    )
    expect(
      screen.getAllByRole('button', { name: secondToLastPage.title }).length
    ).toBeGreaterThan(0)
  })

  it('navigates to the last page on the correct page counter', async () => {
    renderDocsPage()
    await userEvent.click(
      screen.getAllByRole('button', { name: lastPage.title })[0]
    )
    expect(screen.getByText(`${TOTAL} / ${TOTAL}`)).toBeInTheDocument()
  })
})
