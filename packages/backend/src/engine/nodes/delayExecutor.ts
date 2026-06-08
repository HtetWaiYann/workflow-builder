import type { NodeExecutor, ExecutionContext } from '@triggr/shared'
import { DelayConfigSchema } from '@triggr/shared'
import { logger } from '../../lib/logger'

const MS_PER_UNIT = {
  seconds: 1_000,
  minutes: 60_000,
  hours: 3_600_000,
} as const

const DEFAULT_MAX_DELAY_MS = 5 * 60 * 1_000 // 5 minutes

export class DelayExecutor implements NodeExecutor {
  readonly type = 'delay' as const

  async execute(
    nodeData: Record<string, unknown>,
    inputData: Record<string, unknown>,
    _context: ExecutionContext
  ): Promise<Record<string, unknown>> {
    const result = DelayConfigSchema.safeParse(nodeData['config'])
    if (!result.success) {
      throw new Error(
        `Invalid delay config: ${result.error.issues[0]?.message}`
      )
    }

    const { duration, unit } = result.data
    const delayMs = duration * MS_PER_UNIT[unit]
    const maxDelayMs = Number(process.env.MAX_DELAY_MS ?? DEFAULT_MAX_DELAY_MS)

    if (delayMs > maxDelayMs) {
      throw new Error(
        `Delay of ${delayMs}ms exceeds the maximum allowed delay of ${maxDelayMs}ms`
      )
    }

    logger.debug({ delayMs }, 'Delay node waiting')
    await new Promise<void>((resolve) => setTimeout(resolve, delayMs))

    return inputData
  }
}
