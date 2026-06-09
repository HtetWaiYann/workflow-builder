import type { NodeExecutor, ExecutionContext } from '@triggr/shared'

export class ManualTriggerExecutor implements NodeExecutor {
  readonly type = 'manual-trigger' as const

  async execute(
    _nodeData: Record<string, unknown>,
    inputData: Record<string, unknown>,
    _context: ExecutionContext
  ): Promise<Record<string, unknown>> {
    return inputData
  }
}
