import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/api', () => ({
  api: {
    variables: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/components/TopBar', () => ({
  TopBar: () => <div data-testid="top-bar" />,
}))

import { api } from '@/lib/api'
import { toast } from 'sonner'
import { VariablesPage } from '@/pages/VariablesPage'

const mockList = vi.mocked(api.variables.list)
const mockCreate = vi.mocked(api.variables.create)
const mockUpdate = vi.mocked(api.variables.update)
const mockDelete = vi.mocked(api.variables.delete)

const fakeVar = {
  id: 'var-1',
  workspaceId: 'ws-1',
  key: 'API_KEY',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

function renderPage() {
  return render(<VariablesPage />)
}

beforeEach(() => {
  vi.clearAllMocks()
  mockList.mockResolvedValue({ variables: [] })
})

// Variables management page: load, display, add, update, and delete workspace variables.
describe('VariablesPage — loading and display', () => {
  it('shows a loading indicator before the API resolves', () => {
    mockList.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows the empty state message when no variables exist', async () => {
    renderPage()
    await waitFor(() =>
      expect(screen.getByText(/no variables yet/i)).toBeInTheDocument()
    )
  })

  it('renders the variable key once data loads', async () => {
    mockList.mockResolvedValue({ variables: [fakeVar] })
    renderPage()
    await waitFor(() => expect(screen.getByText('API_KEY')).toBeInTheDocument())
  })

  it('renders multiple variables', async () => {
    mockList.mockResolvedValue({
      variables: [fakeVar, { ...fakeVar, id: 'var-2', key: 'DB_PASSWORD' }],
    })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('API_KEY')).toBeInTheDocument()
      expect(screen.getByText('DB_PASSWORD')).toBeInTheDocument()
    })
  })

  it('shows an error state when the list API fails', async () => {
    mockList.mockRejectedValue(new Error('Network error'))
    renderPage()
    await waitFor(() =>
      expect(screen.getByText(/failed to load variables/i)).toBeInTheDocument()
    )
  })
})

describe('VariablesPage — add variable drawer', () => {
  it('opens the add drawer when "Add Variable" button is clicked', async () => {
    renderPage()
    await waitFor(() =>
      screen.getAllByRole('button', { name: /add variable/i })
    )
    await userEvent.click(
      screen.getAllByRole('button', { name: /add variable/i })[0]!
    )
    expect(screen.getByLabelText(/^key$/i)).toBeInTheDocument()
  })

  it('shows a validation error when key contains invalid characters', async () => {
    renderPage()
    await waitFor(() =>
      screen.getAllByRole('button', { name: /add variable/i })
    )
    await userEvent.click(
      screen.getAllByRole('button', { name: /add variable/i })[0]!
    )

    await userEvent.type(screen.getByLabelText(/^key$/i), 'invalid-key!')
    await userEvent.type(screen.getByLabelText(/value/i), 'somevalue')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() =>
      expect(
        screen.getByText(/uppercase letters, digits, and underscores/i)
      ).toBeInTheDocument()
    )
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('calls api.variables.create with the trimmed uppercase key and value', async () => {
    mockCreate.mockResolvedValue({ variable: { ...fakeVar, key: 'NEW_KEY' } })
    renderPage()
    await waitFor(() =>
      screen.getAllByRole('button', { name: /add variable/i })
    )
    await userEvent.click(
      screen.getAllByRole('button', { name: /add variable/i })[0]!
    )

    await userEvent.type(screen.getByLabelText(/^key$/i), 'new_key')
    await userEvent.type(screen.getByLabelText(/value/i), 'secretvalue')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith({
        key: 'NEW_KEY',
        value: 'secretvalue',
      })
    )
  })

  it('shows a success toast after creating a variable', async () => {
    mockCreate.mockResolvedValue({ variable: { ...fakeVar, key: 'NEW_KEY' } })
    renderPage()
    await waitFor(() =>
      screen.getAllByRole('button', { name: /add variable/i })
    )
    await userEvent.click(
      screen.getAllByRole('button', { name: /add variable/i })[0]!
    )

    await userEvent.type(screen.getByLabelText(/^key$/i), 'NEW_KEY')
    await userEvent.type(screen.getByLabelText(/value/i), 'secretvalue')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() =>
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
        expect.stringContaining('NEW_KEY')
      )
    )
  })

  it('closes the drawer after a successful create', async () => {
    mockCreate.mockResolvedValue({ variable: fakeVar })
    renderPage()
    await waitFor(() =>
      screen.getAllByRole('button', { name: /add variable/i })
    )
    await userEvent.click(
      screen.getAllByRole('button', { name: /add variable/i })[0]!
    )

    await userEvent.type(screen.getByLabelText(/^key$/i), 'API_KEY')
    await userEvent.type(screen.getByLabelText(/value/i), 'secret')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() =>
      expect(screen.queryByLabelText(/^key$/i)).not.toBeInTheDocument()
    )
  })
})

describe('VariablesPage — update variable', () => {
  it('opens the edit drawer when "Update" is clicked', async () => {
    mockList.mockResolvedValue({ variables: [fakeVar] })
    renderPage()
    await waitFor(() => screen.getByText('API_KEY'))
    await userEvent.click(screen.getByRole('button', { name: /update/i }))
    expect(screen.getByText(/update api_key/i)).toBeInTheDocument()
  })

  it('calls api.variables.update with the new value', async () => {
    mockList.mockResolvedValue({ variables: [fakeVar] })
    mockUpdate.mockResolvedValue({ variable: { ...fakeVar, key: 'API_KEY' } })
    renderPage()
    await waitFor(() => screen.getByText('API_KEY'))
    await userEvent.click(screen.getByRole('button', { name: /update/i }))

    await userEvent.type(screen.getByLabelText(/new value/i), 'newpassword')
    // Both the row "Update" and the drawer submit button are now in the DOM;
    // the drawer submit is the last one rendered.
    const updateBtns = screen.getAllByRole('button', { name: /^update$/i })
    await userEvent.click(updateBtns[updateBtns.length - 1]!)

    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith('var-1', { value: 'newpassword' })
    )
  })
})

describe('VariablesPage — delete variable', () => {
  it('calls api.variables.delete with the variable id', async () => {
    mockList.mockResolvedValue({ variables: [fakeVar] })
    mockDelete.mockResolvedValue(undefined)
    renderPage()
    await waitFor(() => screen.getByText('API_KEY'))
    await userEvent.click(
      screen.getByRole('button', { name: /delete api_key/i })
    )

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('var-1'))
  })

  it('removes the variable from the list after deletion', async () => {
    mockList.mockResolvedValue({ variables: [fakeVar] })
    mockDelete.mockResolvedValue(undefined)
    renderPage()
    await waitFor(() => screen.getByText('API_KEY'))
    await userEvent.click(
      screen.getByRole('button', { name: /delete api_key/i })
    )

    await waitFor(() =>
      expect(screen.queryByText('API_KEY')).not.toBeInTheDocument()
    )
  })

  it('shows a success toast after deletion', async () => {
    mockList.mockResolvedValue({ variables: [fakeVar] })
    mockDelete.mockResolvedValue(undefined)
    renderPage()
    await waitFor(() => screen.getByText('API_KEY'))
    await userEvent.click(
      screen.getByRole('button', { name: /delete api_key/i })
    )

    await waitFor(() =>
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
        expect.stringContaining('API_KEY')
      )
    )
  })

  it('shows a toast.error when deletion fails', async () => {
    mockList.mockResolvedValue({ variables: [fakeVar] })
    mockDelete.mockRejectedValue(new Error('Permission denied'))
    renderPage()
    await waitFor(() => screen.getByText('API_KEY'))
    await userEvent.click(
      screen.getByRole('button', { name: /delete api_key/i })
    )

    await waitFor(() =>
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Permission denied')
    )
  })
})
