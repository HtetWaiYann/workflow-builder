import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NewWorkflowDialog } from '@/components/workflows/NewWorkflowDialog'

const mockOnOpenChange = vi.fn()
const mockOnSubmit = vi.fn()

function renderDialog(open = true) {
  return render(
    <NewWorkflowDialog
      open={open}
      onOpenChange={mockOnOpenChange}
      onSubmit={mockOnSubmit}
    />
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockOnSubmit.mockResolvedValue(undefined)
})

// Modal form for creating a new workflow. The Create button stays disabled
// until the user types a name and re-enables after a failed submission so
// the user can correct and retry.
describe('NewWorkflowDialog', () => {
  it('renders the name input and a disabled Create button when name is empty', () => {
    renderDialog()
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled()
  })

  it('enables Create once a name is typed', async () => {
    renderDialog()
    await userEvent.type(screen.getByLabelText('Name'), 'My Flow')
    expect(screen.getByRole('button', { name: 'Create' })).not.toBeDisabled()
  })

  it('calls onSubmit with the trimmed name and closes', async () => {
    renderDialog()
    await userEvent.type(screen.getByLabelText('Name'), '  My Flow  ')
    await userEvent.click(screen.getByRole('button', { name: 'Create' }))
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('My Flow')
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('shows an inline error and does not close when onSubmit rejects', async () => {
    mockOnSubmit.mockRejectedValueOnce(new Error('Name already taken'))
    renderDialog()
    await userEvent.type(screen.getByLabelText('Name'), 'My Flow')
    await userEvent.click(screen.getByRole('button', { name: 'Create' }))
    await waitFor(() => {
      expect(screen.getByText('Name already taken')).toBeInTheDocument()
    })
    expect(mockOnOpenChange).not.toHaveBeenCalledWith(false)
  })

  it('shows a submitting label and disables inputs during submission', async () => {
    let resolve!: () => void
    mockOnSubmit.mockReturnValueOnce(new Promise<void>((r) => (resolve = r)))
    renderDialog()
    await userEvent.type(screen.getByLabelText('Name'), 'My Flow')
    await userEvent.click(screen.getByRole('button', { name: 'Create' }))
    expect(screen.getByRole('button', { name: 'Creating…' })).toBeDisabled()
    expect(screen.getByLabelText('Name')).toBeDisabled()
    resolve()
  })
})
