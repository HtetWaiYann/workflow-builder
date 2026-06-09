import type { NodeExecutor, ExecutionContext } from '@triggr/shared'

/** Passes input data through unchanged. Used for trigger nodes and as a stub for unimplemented types. */
export class NoOpExecutor implements NodeExecutor {
  readonly type = 'no-op'

  async execute(
    _nodeData: Record<string, unknown>,
    inputData: Record<string, unknown>,
    _context: ExecutionContext
  ): Promise<Record<string, unknown>> {
    return inputData
  }
}
