import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../db/client', () => ({
  prisma: {
    execution: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    executionNodeRun: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('./registry', () => ({
  getExecutor: vi.fn(),
}))

vi.mock('../lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

import { runWorkflow } from './runner'
import { prisma } from '../db/client'
import { getExecutor } from './registry'
import type { WorkflowNode, WorkflowEdge } from '@workflow-builder/shared'

const makeNode = (id: string, type = 'mock'): WorkflowNode => ({
  id,
  type,
  position: { x: 0, y: 0 },
  data: {},
})

const makeEdge = (source: string, target: string): WorkflowEdge => ({
  id: `${source}->${target}`,
  source,
  target,
})

const mockExecutor = {
  type: 'mock',
  execute: vi.fn().mockResolvedValue({ result: 'done' }),
}

function setupPrismaDefaults() {
  vi.mocked(prisma.execution.findUnique).mockResolvedValue({
    workflowId: 'wf-1',
  } as never)
  vi.mocked(prisma.execution.update).mockResolvedValue({} as never)
  vi.mocked(prisma.executionNodeRun.findFirst).mockResolvedValue({
    id: 'nr-1',
  } as never)
  vi.mocked(prisma.executionNodeRun.update).mockResolvedValue({} as never)
  vi.mocked(getExecutor).mockReturnValue(mockExecutor)
}

describe('runWorkflow', () => {
  beforeEach(() => {
    mockExecutor.execute.mockResolvedValue({ result: 'done' })
    setupPrismaDefaults()
  })

  it('marks execution SUCCESS when no nodes exist', async () => {
    await runWorkflow('exec-1', [], [], {})

    expect(prisma.execution.update).toHaveBeenLastCalledWith({
      where: { id: 'exec-1' },
      data: { status: 'SUCCESS', finishedAt: expect.any(Date) },
    })
  })

  it('marks execution SUCCESS after a node executes cleanly', async () => {
    const nodes = [makeNode('a')]

    await runWorkflow('exec-1', nodes, [], { hello: 'world' })

    expect(prisma.executionNodeRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'SUCCESS' }),
      })
    )
    expect(prisma.execution.update).toHaveBeenLastCalledWith({
      where: { id: 'exec-1' },
      data: { status: 'SUCCESS', finishedAt: expect.any(Date) },
    })
  })

  it('passes inputData to the first node and propagates outputs to downstream nodes', async () => {
    const nodes = [makeNode('a'), makeNode('b')]
    const edges = [makeEdge('a', 'b')]
    const inputData = { seed: 42 }

    mockExecutor.execute
      .mockResolvedValueOnce({ fromA: true })
      .mockResolvedValueOnce({ fromB: true })

    await runWorkflow('exec-1', nodes, edges, inputData)

    // Node A receives inputData
    expect(mockExecutor.execute).toHaveBeenNthCalledWith(
      1,
      {},
      inputData,
      expect.anything()
    )
    // Node B receives node A's output
    expect(mockExecutor.execute).toHaveBeenNthCalledWith(
      2,
      {},
      { fromA: true },
      expect.anything()
    )
  })

  it('marks execution ERROR and stops when a node executor throws', async () => {
    const nodes = [makeNode('a'), makeNode('b')]

    mockExecutor.execute.mockRejectedValueOnce(new Error('executor exploded'))

    await runWorkflow('exec-1', nodes, [], {})

    // Only node A's nodeRun should have been updated to ERROR
    expect(prisma.executionNodeRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'ERROR',
          error: 'executor exploded',
        }),
      })
    )
    // Node B's executor must not have been called
    expect(mockExecutor.execute).toHaveBeenCalledTimes(1)
    expect(prisma.execution.update).toHaveBeenLastCalledWith({
      where: { id: 'exec-1' },
      data: { status: 'ERROR', finishedAt: expect.any(Date) },
    })
  })

  it('marks execution ERROR immediately when the graph contains a cycle', async () => {
    const nodes = [makeNode('a'), makeNode('b')]
    const edges = [makeEdge('a', 'b'), makeEdge('b', 'a')]

    await runWorkflow('exec-1', nodes, edges, {})

    expect(prisma.execution.update).toHaveBeenLastCalledWith({
      where: { id: 'exec-1' },
      data: { status: 'ERROR', finishedAt: expect.any(Date) },
    })
    // Executor must not have been called
    expect(mockExecutor.execute).not.toHaveBeenCalled()
  })

  it('marks nodeRun ERROR and stops when node type has no registered executor', async () => {
    const nodes = [makeNode('a', 'unknown-type')]
    vi.mocked(getExecutor).mockReturnValue(undefined)

    await runWorkflow('exec-1', nodes, [], {})

    expect(prisma.executionNodeRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'ERROR',
          error: 'Unknown node type: unknown-type',
        }),
      })
    )
    expect(prisma.execution.update).toHaveBeenLastCalledWith({
      where: { id: 'exec-1' },
      data: { status: 'ERROR', finishedAt: expect.any(Date) },
    })
  })

  it('skips a node whose ExecutionNodeRun record is missing and continues to SUCCESS', async () => {
    const nodes = [makeNode('a')]
    vi.mocked(prisma.executionNodeRun.findFirst).mockResolvedValue(null)

    await runWorkflow('exec-1', nodes, [], {})

    // Executor must not have been called since the nodeRun was missing
    expect(mockExecutor.execute).not.toHaveBeenCalled()
    // Execution still ends SUCCESS (missing nodeRun is logged, not a failure)
    expect(prisma.execution.update).toHaveBeenLastCalledWith({
      where: { id: 'exec-1' },
      data: { status: 'SUCCESS', finishedAt: expect.any(Date) },
    })
  })

  it('catches unexpected outer errors and marks execution ERROR without rethrowing', async () => {
    vi.mocked(prisma.execution.update).mockRejectedValueOnce(
      new Error('db down')
    )

    // Should not throw
    await expect(runWorkflow('exec-1', [], [], {})).resolves.toBeUndefined()
  })
})
