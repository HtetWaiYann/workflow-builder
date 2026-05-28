import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.mock factories are hoisted before variable declarations, so the mocks
// must be created inside vi.hoisted() to be accessible in the factory.
const { mockSendMail, mockCreateTransport } = vi.hoisted(() => {
  const mockSendMail = vi.fn().mockResolvedValue({})
  const mockCreateTransport = vi
    .fn()
    .mockReturnValue({ sendMail: mockSendMail })
  return { mockSendMail, mockCreateTransport }
})

vi.mock('nodemailer', () => ({
  default: { createTransport: mockCreateTransport },
}))

vi.mock('../../lib/logger', () => ({
  logger: { warn: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() },
}))

import { SendEmailExecutor } from './sendEmailExecutor'
import type { ExecutionContext } from '@workflow-builder/shared'

const ctx: ExecutionContext = {
  executionId: 'exec-1',
  workflowId: 'wf-1',
  nodeOutputs: {},
}

const executor = new SendEmailExecutor()

const validConfig = {
  config: {
    to: 'recipient@example.com',
    subject: 'Hello',
    body: 'Test body',
    smtpHost: 'smtp.example.com',
    smtpPort: 587,
    smtpUser: 'user@example.com',
    smtpPass: 'secret',
    smtpFrom: 'sender@example.com',
  },
}

// Sends an email via a nodemailer transporter built from the node config.
// Returns inputData with emailSent: true and the recipient address.
describe('SendEmailExecutor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateTransport.mockReturnValue({ sendMail: mockSendMail })
    mockSendMail.mockResolvedValue({})
  })

  it('has type "send-email"', () => {
    expect(executor.type).toBe('send-email')
  })

  it('creates a transporter with the configured SMTP settings', async () => {
    await executor.execute(validConfig, {}, ctx)
    expect(mockCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.example.com',
        port: 587,
        auth: { user: 'user@example.com', pass: 'secret' },
      })
    )
  })

  it('calls sendMail with the correct fields', async () => {
    await executor.execute(validConfig, {}, ctx)
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Hello',
        text: 'Test body',
      })
    )
  })

  it('returns inputData with emailSent: true and the to address', async () => {
    const out = await executor.execute(validConfig, { upstream: 'value' }, ctx)
    expect(out['emailSent']).toBe(true)
    expect(out['to']).toBe('recipient@example.com')
    expect(out['upstream']).toBe('value')
  })

  it('uses secure: true when smtpPort is 465', async () => {
    await executor.execute(
      { config: { ...validConfig.config, smtpPort: 465 } },
      {},
      ctx
    )
    expect(mockCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({ secure: true })
    )
  })

  it('uses secure: false when smtpPort is not 465', async () => {
    await executor.execute(validConfig, {}, ctx)
    expect(mockCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({ secure: false })
    )
  })

  it('propagates errors thrown by sendMail', async () => {
    mockSendMail.mockRejectedValue(new Error('SMTP connection refused'))
    await expect(executor.execute(validConfig, {}, ctx)).rejects.toThrow(
      'SMTP connection refused'
    )
  })

  it('throws on invalid config (missing to field)', async () => {
    const bad = { config: { ...validConfig.config, to: '' } }
    await expect(executor.execute(bad, {}, ctx)).rejects.toThrow(
      'Invalid send-email config'
    )
  })

  it('throws on invalid config (missing smtpHost)', async () => {
    const bad = { config: { ...validConfig.config, smtpHost: '' } }
    await expect(executor.execute(bad, {}, ctx)).rejects.toThrow(
      'Invalid send-email config'
    )
  })
})
