import { logger } from '../lib/logger'

interface InviteEmailParams {
  email: string
  to_email: string
  workspace_name: string
  invited_by: string
  role: string
  invite_link: string
}

/**
 * Sends a workspace invite email via the EmailJS REST API.
 * Requires EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY,
 * EMAILJS_PRIVATE_KEY, and FRONTEND_URL environment variables.
 * Logs a warning and resolves without throwing if any variable is missing,
 * so invite creation still succeeds even when email is not configured.
 *
 * @param params - Template variables forwarded to the EmailJS template.
 */
export async function sendInviteEmail(
  params: InviteEmailParams
): Promise<void> {
  const serviceId = process.env.EMAILJS_SERVICE_ID
  const templateId = process.env.EMAILJS_TEMPLATE_ID
  const publicKey = process.env.EMAILJS_PUBLIC_KEY
  const privateKey = process.env.EMAILJS_PRIVATE_KEY

  if (!serviceId || !templateId || !publicKey) {
    logger.warn('EmailJS env vars not configured — skipping invite email')
    return
  }

  const body: Record<string, unknown> = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: params,
  }

  if (privateKey) body.accessToken = privateKey

  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    logger.error({ status: res.status, body: text }, 'EmailJS request failed')
    throw new Error(`Failed to send invite email (status ${res.status})`)
  }
}
