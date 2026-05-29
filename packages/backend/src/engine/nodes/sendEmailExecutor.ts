import nodemailer from 'nodemailer'
import type { NodeExecutor, ExecutionContext } from '@workflow-builder/shared'
import { SendEmailConfigSchema } from '@workflow-builder/shared'
import { logger } from '../../lib/logger'

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

    // Transporter created per-execution — no module-level state — so concurrent
    // executions with different SMTP configs can never share a transporter.
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    })

    logger.debug({ to, subject }, 'Sending email')

    await transporter.sendMail({ from: smtpFrom, to, subject, text: body })

    return { ...inputData, emailSent: true, to }
  }
}
