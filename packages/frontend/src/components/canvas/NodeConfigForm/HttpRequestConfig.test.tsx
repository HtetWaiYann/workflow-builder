import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpRequestConfig } from '@/components/canvas/NodeConfigForm/HttpRequestConfig'

// Config form for the http-request node: method, URL, headers, and optional body.
describe('HttpRequestConfig', () => {
  it('renders the method select showing the current method', () => {
    render(
      <HttpRequestConfig
        config={{ method: 'GET', url: '', headers: '' }}
        onChange={vi.fn()}
      />
    )
    expect(
      within(screen.getByRole('combobox')).getByText('GET')
    ).toBeInTheDocument()
  })

  it('renders the URL input showing the current value', () => {
    render(
      <HttpRequestConfig
        config={{ method: 'GET', url: 'https://api.example.com', headers: '' }}
        onChange={vi.fn()}
      />
    )
    expect(
      screen.getByDisplayValue('https://api.example.com')
    ).toBeInTheDocument()
  })

  it('hides the body field for GET requests', () => {
    render(<HttpRequestConfig config={{ method: 'GET' }} onChange={vi.fn()} />)
    expect(screen.queryByText('Body (JSON)')).toBeNull()
  })

  it('hides the body field for DELETE requests', () => {
    render(
      <HttpRequestConfig config={{ method: 'DELETE' }} onChange={vi.fn()} />
    )
    expect(screen.queryByText('Body (JSON)')).toBeNull()
  })

  it('shows the body field for POST requests', () => {
    render(<HttpRequestConfig config={{ method: 'POST' }} onChange={vi.fn()} />)
    expect(screen.getByText('Body (JSON)')).toBeInTheDocument()
  })

  it('shows the body field for PUT requests', () => {
    render(<HttpRequestConfig config={{ method: 'PUT' }} onChange={vi.fn()} />)
    expect(screen.getByText('Body (JSON)')).toBeInTheDocument()
  })

  it('calls onChange with the updated URL when the input changes', () => {
    const onChange = vi.fn()
    render(
      <HttpRequestConfig
        config={{ method: 'GET', url: '' }}
        onChange={onChange}
      />
    )
    fireEvent.change(
      screen.getByPlaceholderText('https://api.example.com/endpoint'),
      { target: { value: 'https://api.test.com' } }
    )
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ url: 'https://api.test.com' })
    )
  })

  it('calls onChange with the updated method when the select changes', async () => {
    const onChange = vi.fn()
    render(
      <HttpRequestConfig
        config={{ method: 'GET', url: '' }}
        onChange={onChange}
      />
    )
    fireEvent.keyDown(screen.getByRole('combobox'), { key: ' ' })
    await userEvent.click(await screen.findByRole('option', { name: 'POST' }))
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('calls onChange with the updated headers when the textarea changes', () => {
    const onChange = vi.fn()
    render(
      <HttpRequestConfig
        config={{ method: 'GET', url: '', headers: '' }}
        onChange={onChange}
      />
    )
    // Use index 1 because index 0 is the URL input
    const textboxes = screen.getAllByRole('textbox')
    fireEvent.change(textboxes[1], {
      target: { value: '{"Authorization":"Bearer token"}' },
    })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ headers: '{"Authorization":"Bearer token"}' })
    )
  })
})
