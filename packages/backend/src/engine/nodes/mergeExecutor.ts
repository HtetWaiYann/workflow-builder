import type { NodeExecutor, ExecutionContext } from '@workflow-builder/shared'
import { z } from 'zod'

const MergeInputSchema = z.object({
  inputs: z.array(z.record(z.string(), z.unknown())),
})

export class MergeExecutor implements NodeExecutor {
  readonly type = 'merge' as const

  async execute(
    _nodeData: Record<string, unknown>,
    inputData: Record<string, unknown>,
    _context: ExecutionContext
  ): Promise<Record<string, unknown>> {
    const result = MergeInputSchema.safeParse(inputData)
    if (!result.success) {
      // Single upstream branch — wrap and merge gracefully
      return { ...inputData }
    }
    return Object.assign({}, ...result.data.inputs) as Record<string, unknown>
  }
}
