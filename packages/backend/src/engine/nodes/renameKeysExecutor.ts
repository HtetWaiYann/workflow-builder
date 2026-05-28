import type { NodeExecutor, ExecutionContext } from '@workflow-builder/shared'
import { RenameKeysConfigSchema } from '@workflow-builder/shared'

export class RenameKeysExecutor implements NodeExecutor {
  readonly type = 'rename-keys' as const

  async execute(
    nodeData: Record<string, unknown>,
    inputData: Record<string, unknown>,
    _context: ExecutionContext
  ): Promise<Record<string, unknown>> {
    const result = RenameKeysConfigSchema.safeParse(nodeData['config'])
    if (!result.success) {
      throw new Error(
        `Invalid rename-keys config: ${result.error.issues[0]?.message}`
      )
    }

    const output = { ...inputData }
    for (const { from, to } of result.data.mappings) {
      if (from in output) {
        output[to] = output[from]
        delete output[from]
      }
    }
    return output
  }
}
