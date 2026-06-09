import type { ExecutionContext } from '@triggr/shared'

/** Builds a fresh ExecutionContext for a given run. nodeOutputs starts empty and is populated by the runner. */
const createExecutionContext = (
  executionId: string,
  workflowId: string
): ExecutionContext => ({
  executionId,
  workflowId,
  nodeOutputs: {},
})

export { createExecutionContext }
