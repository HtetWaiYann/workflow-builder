import type { NodeExecutor, ExecutionContext } from '@workflow-builder/shared'
import { SwitchConfigSchema, BRANCH_HANDLE_KEY } from '@workflow-builder/shared'

export class SwitchExecutor implements NodeExecutor {
  readonly type = 'switch' as const

  async execute(
    nodeData: Record<string, unknown>,
    inputData: Record<string, unknown>,
    _context: ExecutionContext
  ): Promise<Record<string, unknown>> {
    const result = SwitchConfigSchema.safeParse(nodeData['config'])
    if (!result.success) {
      throw new Error(
        `Invalid switch config: ${result.error.issues[0]?.message}`
      )
    }

    const { field, cases } = result.data
    const fieldValue = String(inputData[field] ?? '')

    // Cases are positional: index 0 → 'case1', index 1 → 'case2', etc.
    // matching the static port IDs defined in the frontend node registry.
    const matchedIndex = cases.findIndex((c) => c.value === fieldValue)
    const activeHandle =
      matchedIndex >= 0 ? `case${matchedIndex + 1}` : 'default'

    return {
      [BRANCH_HANDLE_KEY]: activeHandle,
      field,
      fieldValue,
      matchedCase: matchedIndex >= 0 ? cases[matchedIndex] : null,
    }
  }
}
