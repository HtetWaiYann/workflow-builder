import ivm from 'isolated-vm'
import type { NodeExecutor, ExecutionContext } from '@triggr/shared'
import { RunJsCodeConfigSchema } from '@triggr/shared'

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

    // Each execution gets its own V8 isolate — a true security boundary with
    // a separate heap, no access to Node.js globals or require().
    const isolate = new ivm.Isolate({ memoryLimit: 128 })
    try {
      const context = await isolate.createContext()
      const jail = context.global

      // Copy input data into the isolate (JSON-serializable values only)
      await jail.set('$input', new ivm.ExternalCopy(inputData).copyInto())

      // Validate and serialize the result inside the isolate so no object
      // references cross the boundary — only a JSON string comes back.
      const wrappedCode = `
        (function() {
          const __res__ = (function() { ${code} })();
          if (__res__ === null || typeof __res__ !== 'object' || Array.isArray(__res__)) {
            throw new Error('Code must return a plain object (e.g. return { key: value })');
          }
          return JSON.stringify(__res__);
        })()
      `

      let resultJson: unknown
      try {
        const script = await isolate.compileScript(wrappedCode)
        resultJson = await script.run(context, { timeout: 5000 })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        throw new Error(`Code execution failed: ${message}`)
      }

      if (typeof resultJson !== 'string') {
        throw new Error(
          'Code must return a plain object (e.g. return { key: value })'
        )
      }

      return JSON.parse(resultJson) as Record<string, unknown>
    } finally {
      isolate.dispose()
    }
  }
}
