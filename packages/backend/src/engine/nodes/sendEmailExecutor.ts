import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import type { NodeExecutor, ExecutionContext } from '@workflow-builder/shared'
import { SendEmailConfigSchema } from '@workflow-builder/shared'
import { logger } from '../../lib/logger'

let _transporter: Transporter | null = null

/**
 * Returns a cached nodemailer transporter built from the config values
 * resolved from the node's config (which may reference workspace variables).
 * A new transporter is created whenever host/user changes.
 */
function getTransporter(
  host: string,
  port: number,
  user: string,
  pass: string
): Transporter {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })
  }
  return _transporter
}

export class SendEmailExecutor implements NodeExecutor {
  readonly type = 'send-email' as const

  async execute(
    nodeData: Record<string, unknown>,
    inputData: Record<string, unknown>,
    _context: ExecutionContext
  ): Promise<Record<string, unknown>> {
    const result = SendEmailConfigSchema.safeParse(nodeData['config'])
    if (!result.success) {
      throw new Error(
        `Invalid send-email config: ${result.error.issues[0]?.message}`
      )
    }

    const {
      to,
      subject,
      body,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      smtpFrom,
    } = result.data

    // Reset cached transporter when credentials change between executions
    _transporter = null
    const transporter = getTransporter(smtpHost, smtpPort, smtpUser, smtpPass)

    logger.debug({ to, subject }, 'Sending email')

    await transporter.sendMail({
      from: smtpFrom,
      to,
      subject,
      text: body,
    })

    return { ...inputData, emailSent: true, to }
  }
}
