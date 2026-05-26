import { runInNewContext } from 'node:vm'
import type { NodeExecutor, ExecutionContext } from '@workflow-builder/shared'
import { RunJsCodeConfigSchema } from '@workflow-builder/shared'

// node:vm isolates variable scope but is NOT a full security sandbox.
// It prevents accidental require() calls and global pollution, not malicious escapes.
// Suitable for an internal tool with authenticated users only.

export class RunJsCodeExecutor implements NodeExecutor {
  readonly type = 'run-js-code' as const

  async execute(
    nodeData: Record<string, unknown>,
    inputData: Record<string, unknown>,
    _context: ExecutionContext
  ): Promise<Record<string, unknown>> {
    const result = RunJsCodeConfigSchema.safeParse(nodeData['config'])
    if (!result.success) {
      throw new Error(
        `Invalid run-js-code config: ${result.error.issues[0]?.message}`
      )
    }

    const { code } = result.data
    const sandbox: Record<string, unknown> = {
      $input: inputData,
      result: undefined,
    }

    try {
      runInNewContext(`result = (function() { ${code} })()`, sandbox, {
        timeout: 5000,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      throw new Error(`Code execution failed: ${message}`)
    }

    const output = sandbox['result']
    if (
      output === null ||
      typeof output !== 'object' ||
      Array.isArray(output)
    ) {
      throw new Error(
        'Code must return a plain object (e.g. return { key: value })'
      )
    }

    return output as Record<string, unknown>
  }
}
