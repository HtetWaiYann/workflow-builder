import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import { logger } from '../lib/logger'
import { sendInviteEmail } from './email'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

const PARAMS = {
  email: 'bob@example.com',
  to_email: 'bob@example.com',
  workspace_name: 'Acme',
  invited_by: 'alice@example.com',
  role: 'EDITOR',
  invite_link: 'https://app.example.com/invites/abc',
}

beforeEach(() => {
  vi.clearAllMocks()
  delete process.env['EMAILJS_SERVICE_ID']
  delete process.env['EMAILJS_TEMPLATE_ID']
  delete process.env['EMAILJS_PUBLIC_KEY']
  delete process.env['EMAILJS_PRIVATE_KEY']
})

// Sends a workspace invite via the EmailJS REST API. Silently skips
// when env vars are missing so invite creation always succeeds.
describe('sendInviteEmail', () => {
  it('logs a warning and skips the fetch when required env vars are missing', async () => {
    await sendInviteEmail(PARAMS)

    expect(mockFetch).not.toHaveBeenCalled()
    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
      'EmailJS env vars not configured — skipping invite email'
    )
  })

  it('sends a POST to the EmailJS API when env vars are configured', async () => {
    process.env['EMAILJS_SERVICE_ID'] = 'svc-id'
    process.env['EMAILJS_TEMPLATE_ID'] = 'tpl-id'
    process.env['EMAILJS_PUBLIC_KEY'] = 'pub-key'
    mockFetch.mockResolvedValue({ ok: true })

    await sendInviteEmail(PARAMS)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.emailjs.com/api/v1.0/email/send',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('includes service_id, template_id, user_id, and template_params in the body', async () => {
    process.env['EMAILJS_SERVICE_ID'] = 'svc-id'
    process.env['EMAILJS_TEMPLATE_ID'] = 'tpl-id'
    process.env['EMAILJS_PUBLIC_KEY'] = 'pub-key'
    mockFetch.mockResolvedValue({ ok: true })

    await sendInviteEmail(PARAMS)

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(init.body as string)
    expect(body.service_id).toBe('svc-id')
    expect(body.template_id).toBe('tpl-id')
    expect(body.user_id).toBe('pub-key')
    expect(body.template_params).toEqual(PARAMS)
  })

  it('includes accessToken when EMAILJS_PRIVATE_KEY is set', async () => {
    process.env['EMAILJS_SERVICE_ID'] = 'svc-id'
    process.env['EMAILJS_TEMPLATE_ID'] = 'tpl-id'
    process.env['EMAILJS_PUBLIC_KEY'] = 'pub-key'
    process.env['EMAILJS_PRIVATE_KEY'] = 'priv-key'
    mockFetch.mockResolvedValue({ ok: true })

    await sendInviteEmail(PARAMS)

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(init.body as string)
    expect(body.accessToken).toBe('priv-key')
  })

  it('omits accessToken when EMAILJS_PRIVATE_KEY is not set', async () => {
    process.env['EMAILJS_SERVICE_ID'] = 'svc-id'
    process.env['EMAILJS_TEMPLATE_ID'] = 'tpl-id'
    process.env['EMAILJS_PUBLIC_KEY'] = 'pub-key'
    mockFetch.mockResolvedValue({ ok: true })

    await sendInviteEmail(PARAMS)

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(init.body as string)
    expect(body.accessToken).toBeUndefined()
  })

  it('throws when the EmailJS API returns a non-ok response', async () => {
    process.env['EMAILJS_SERVICE_ID'] = 'svc-id'
    process.env['EMAILJS_TEMPLATE_ID'] = 'tpl-id'
    process.env['EMAILJS_PUBLIC_KEY'] = 'pub-key'
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: vi.fn().mockResolvedValue('Bad request'),
    })

    await expect(sendInviteEmail(PARAMS)).rejects.toThrow(
      'Failed to send invite email (status 400)'
    )
  })
})
