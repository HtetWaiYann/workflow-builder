import ivm from 'isolated-vm'
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

    const rawItems = Array.isArray(inputData['items'])
      ? inputData['items']
      : Array.isArray(inputData['data'])
        ? inputData['data']
        : []

    // One isolate per node execution; one compiled script reused per item.
    // Each item is copied into the isolate's global before running the expression.
    const isolate = new ivm.Isolate({ memoryLimit: 32 })
    try {
      const context = await isolate.createContext()
      const jail = context.global
      const script = await isolate.compileScript(`!!(${expression})`)

      const filtered: unknown[] = []
      for (const item of rawItems) {
        try {
          await jail.set('item', new ivm.ExternalCopy(item).copyInto())
          const keep = await script.run(context, { timeout: 1000 })
          if (keep) filtered.push(item)
        } catch (err) {
          logger.warn(
            { expression, err },
            'filter-array expression threw — item excluded'
          )
        }
      }

      return { ...inputData, items: filtered }
    } finally {
      isolate.dispose()
    }
  }
}
