import type { NodeExecutor, ExecutionContext } from '@triggr/shared'
import { SlackMessageConfigSchema } from '@triggr/shared'
import { logger } from '../../lib/logger'
import { assertSafeUrl } from '../../lib/ssrfGuard'

export class SlackMessageExecutor implements NodeExecutor {
  readonly type = 'slack-message' as const

  async execute(
    nodeData: Record<string, unknown>,
    inputData: Record<string, unknown>,
    _context: ExecutionContext
  ): Promise<Record<string, unknown>> {
    const result = SlackMessageConfigSchema.safeParse(nodeData['config'])
    if (!result.success) {
      throw new Error(
        `Invalid slack-message config: ${result.error.issues[0]?.message}`
      )
    }

    const { webhookUrl, message } = result.data

    await assertSafeUrl(webhookUrl)

    logger.debug({ webhookUrl }, 'Posting Slack message')

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Slack webhook returned ${response.status}: ${body}`)
    }

    return { ...inputData, slackSent: true }
  }
}
