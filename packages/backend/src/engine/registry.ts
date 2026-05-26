import type { NodeExecutor } from '@workflow-builder/shared'
import { NoOpExecutor } from './nodes/noOpExecutor'

const executors = new Map<string, NodeExecutor>()

const register = (executor: NodeExecutor): void => {
  executors.set(executor.type, executor)
}

register(new NoOpExecutor())

/** Returns the executor for a node type, or undefined if none is registered. */
export const getExecutor = (type: string): NodeExecutor | undefined =>
  executors.get(type)
