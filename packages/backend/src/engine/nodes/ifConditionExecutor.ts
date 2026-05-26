import type { NodeExecutor, ExecutionContext } from '@workflow-builder/shared'
import { IfConditionConfigSchema } from '@workflow-builder/shared'
import { BRANCH_HANDLE_KEY } from '@workflow-builder/shared'

function evaluate(
  fieldValue: unknown,
  operator: string,
  compareValue: unknown
): boolean {
  switch (operator) {
    case '==':
      // eslint-disable-next-line eqeqeq
      return fieldValue == compareValue
    case '!=':
      // eslint-disable-next-line eqeqeq
      return fieldValue != compareValue
    case '>':
      return Number(fieldValue) > Number(compareValue)
    case '<':
      return Number(fieldValue) < Number(compareValue)
    case '>=':
      return Number(fieldValue) >= Number(compareValue)
    case '<=':
      return Number(fieldValue) <= Number(compareValue)
    case 'contains':
      return String(fieldValue).includes(String(compareValue))
    case 'not contains':
      return !String(fieldValue).includes(String(compareValue))
    default:
      throw new Error(`Unknown operator: ${operator}`)
  }
}

export class IfConditionExecutor implements NodeExecutor {
  readonly type = 'if-condition' as const

  async execute(
    nodeData: Record<string, unknown>,
    inputData: Record<string, unknown>,
    _context: ExecutionContext
  ): Promise<Record<string, unknown>> {
    const result = IfConditionConfigSchema.safeParse(nodeData['config'])
    if (!result.success) {
      throw new Error(
        `Invalid if-condition config: ${result.error.issues[0]?.message}`
      )
    }

    const { field, operator, value } = result.data
    const fieldValue = inputData[field]
    const matched = evaluate(fieldValue, operator, value)

    return {
      [BRANCH_HANDLE_KEY]: matched ? 'true' : 'false',
      result: matched,
      field,
      fieldValue,
    }
  }
}
