import { runInNewContext } from 'node:vm'
import type { NodeExecutor, ExecutionContext } from '@workflow-builder/shared'
import { FilterArrayConfigSchema } from '@workflow-builder/shared'
import { logger } from '../../lib/logger'

export class FilterArrayExecutor implements NodeExecutor {
  readonly type = 'filter-array' as const

  async execute(
    nodeData: Record<string, unknown>,
    inputData: Record<string, unknown>,
    _context: ExecutionContext
  ): Promise<Record<string, unknown>> {
    const result = FilterArrayConfigSchema.safeParse(nodeData['config'])
    if (!result.success) {
      throw new Error(
        `Invalid filter-array config: ${result.error.issues[0]?.message}`
      )
    }

    const { expression } = result.data

    // Accept items from 'items' or 'data' key, or an empty array as fallback
    const rawItems = Array.isArray(inputData['items'])
      ? inputData['items']
      : Array.isArray(inputData['data'])
        ? inputData['data']
        : []

    const filtered = rawItems.filter((item) => {
      try {
        const sandbox: Record<string, unknown> = { item, result: false }
        runInNewContext(`result = !!(${expression})`, sandbox, {
          timeout: 1000,
        })
        return Boolean(sandbox['result'])
      } catch (err) {
        logger.warn(
          { expression, err },
          'filter-array expression threw — item excluded'
        )
        return false
      }
    })

    return { ...inputData, items: filtered }
  }
}
