import type { NodeExecutor, ExecutionContext } from '@workflow-builder/shared'

export class CronTriggerExecutor implements NodeExecutor {
  readonly type = 'cron-trigger' as const

  async execute(
    _nodeData: Record<string, unknown>,
    inputData: Record<string, unknown>,
    _context: ExecutionContext
  ): Promise<Record<string, unknown>> {
    return inputData
  }
}
