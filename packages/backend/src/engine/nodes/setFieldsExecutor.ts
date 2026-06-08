import type { NodeExecutor, ExecutionContext } from '@triggr/shared'
import { SetFieldsConfigSchema } from '@triggr/shared'

export class SetFieldsExecutor implements NodeExecutor {
  readonly type = 'set-fields' as const

  async execute(
    nodeData: Record<string, unknown>,
    inputData: Record<string, unknown>,
    _context: ExecutionContext
  ): Promise<Record<string, unknown>> {
    const result = SetFieldsConfigSchema.safeParse(nodeData['config'])
    if (!result.success) {
      throw new Error(
        `Invalid set-fields config: ${result.error.issues[0]?.message}`
      )
    }

    const output = { ...inputData }
    for (const { key, value } of result.data.fields) {
      output[key] = value
    }
    return output
  }
}
