import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../middleware/auth', () => ({
  requireAuth: (
    req: Record<string, unknown>,
    _res: unknown,
    next: () => void
  ) => {
    req['userId'] = 'test-user-id'
    next()
  },
}))

vi.mock('../middleware/workspace', () => ({
  requireWorkspace: (
    req: Record<string, unknown>,
    _res: unknown,
    next: () => void
  ) => {
    req['workspaceId'] = 'test-workspace-id'
    next()
  },
}))

vi.mock('../db/client', () => ({
  prisma: {
    workflow: {
      findFirst: vi.fn(),
    },
    execution: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('../engine/runner', () => ({
  runWorkflow: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import express from 'express'
import request from 'supertest'
import workflowRouter from './workflows'
import { executionDetailRouter } from './executions'
import { prisma } from '../db/client'
import { runWorkflow } from '../engine/runner'

// App for sub-router routes: POST/GET /workflows/:id/executions
const app = express()
app.use(express.json())
app.use('/workflows', workflowRouter)

// App for detail route: GET /executions/:id
const detailApp = express()
detailApp.use(express.json())
detailApp.use('/executions', executionDetailRouter)

const NOW = new Date('2024-01-15T10:00:00.000Z')

const mockWorkflow = {
  id: 'wf-1',
  workspaceId: 'test-workspace-id',
  name: 'Test Workflow',
  status: 'DRAFT' as const,
  nodes: [],
  edges: [],
  createdAt: NOW,
  updatedAt: NOW,
}

const mockExecution = {
  id: 'exec-1',
  workflowId: 'wf-1',
  status: 'PENDING',
  inputData: null,
  startedAt: null,
  finishedAt: null,
  createdAt: NOW,
}

// Helper: make prisma.$transaction resolve directly with the given execution record
// (the callback is never invoked; the route only uses the resolved value)
function mockTxResolve(result: unknown): void {
  vi.mocked(
    prisma.$transaction as unknown as (...a: unknown[]) => Promise<unknown>
  ).mockResolvedValue(result)
}

describe('POST /workflows/:id/executions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('triggers execution and returns 202 with execution summary', async () => {
    vi.mocked(prisma.workflow.findFirst).mockResolvedValue(
      mockWorkflow as never
    )
    mockTxResolve(mockExecution)

    const res = await request(app)
      .post('/workflows/wf-1/executions')
      .send({ inputData: { hello: 'world' } })

    expect(res.status).toBe(202)
    expect(res.body.execution).toMatchObject({
      id: 'exec-1',
      status: 'PENDING',
    })
    expect(res.body.execution.nodeRuns).toBeUndefined()
  })

  it('calls runWorkflow as fire-and-forget after responding', async () => {
    vi.mocked(prisma.workflow.findFirst).mockResolvedValue(
      mockWorkflow as never
    )
    mockTxResolve(mockExecution)

    await request(app).post('/workflows/wf-1/executions').send({})

    expect(runWorkflow).toHaveBeenCalledWith('exec-1', [], [], {})
  })

  it('works without an inputData body (defaults to empty object)', async () => {
    vi.mocked(prisma.workflow.findFirst).mockResolvedValue(
      mockWorkflow as never
    )
    mockTxResolve(mockExecution)

    const res = await request(app).post('/workflows/wf-1/executions').send({})
    expect(res.status).toBe(202)
  })

  it('returns 404 when workflow does not exist', async () => {
    vi.mocked(prisma.workflow.findFirst).mockResolvedValue(null)

    const res = await request(app).post('/workflows/wf-1/executions').send({})
    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })

  it('returns 400 when inputData is not an object', async () => {
    const res = await request(app)
      .post('/workflows/wf-1/executions')
      .send({ inputData: 'not-an-object' })
    expect(res.status).toBe(400)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })
})

describe('GET /workflows/:id/executions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with a list of execution summaries', async () => {
    vi.mocked(prisma.workflow.findFirst).mockResolvedValue({
      id: 'wf-1',
    } as never)
    vi.mocked(prisma.execution.findMany).mockResolvedValue([
      mockExecution,
    ] as never)

    const res = await request(app).get('/workflows/wf-1/executions')
    expect(res.status).toBe(200)
    expect(res.body.executions).toHaveLength(1)
    expect(res.body.executions[0]).toMatchObject({
      id: 'exec-1',
      status: 'PENDING',
    })
    expect(res.body.executions[0].nodeRuns).toBeUndefined()
  })

  it('returns 200 with empty list when no executions', async () => {
    vi.mocked(prisma.workflow.findFirst).mockResolvedValue({
      id: 'wf-1',
    } as never)
    vi.mocked(prisma.execution.findMany).mockResolvedValue([])

    const res = await request(app).get('/workflows/wf-1/executions')
    expect(res.status).toBe(200)
    expect(res.body.executions).toEqual([])
  })

  it('returns 404 when workflow does not exist', async () => {
    vi.mocked(prisma.workflow.findFirst).mockResolvedValue(null)

    const res = await request(app).get('/workflows/wf-1/executions')
    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })
})

describe('GET /executions/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with the full execution including nodeRuns', async () => {
    vi.mocked(prisma.execution.findUnique).mockResolvedValue({
      ...mockExecution,
      nodeRuns: [],
      workflow: { workspaceId: 'test-workspace-id' },
    } as never)

    const res = await request(detailApp).get('/executions/exec-1')
    expect(res.status).toBe(200)
    expect(res.body.execution.id).toBe('exec-1')
    expect(Array.isArray(res.body.execution.nodeRuns)).toBe(true)
  })

  it('returns 404 when execution does not exist', async () => {
    vi.mocked(prisma.execution.findUnique).mockResolvedValue(null)

    const res = await request(detailApp).get('/executions/nonexistent')
    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })

  it('returns 404 when execution belongs to a different workspace', async () => {
    vi.mocked(prisma.execution.findUnique).mockResolvedValue({
      ...mockExecution,
      nodeRuns: [],
      workflow: { workspaceId: 'other-workspace-id' }, // different from test-workspace-id
    } as never)

    const res = await request(detailApp).get('/executions/exec-1')
    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })

  it('returns nodeRuns with the full field set', async () => {
    vi.mocked(prisma.execution.findUnique).mockResolvedValue({
      ...mockExecution,
      status: 'SUCCESS',
      startedAt: NOW,
      finishedAt: NOW,
      nodeRuns: [
        {
          id: 'nr-1',
          executionId: 'exec-1',
          nodeId: 'node-a',
          status: 'SUCCESS',
          inputData: { x: 1 },
          outputData: { y: 2 },
          error: null,
          startedAt: NOW,
          finishedAt: NOW,
        },
      ],
      workflow: { workspaceId: 'test-workspace-id' },
    } as never)

    const res = await request(detailApp).get('/executions/exec-1')
    expect(res.status).toBe(200)
    expect(res.body.execution.nodeRuns).toHaveLength(1)
    expect(res.body.execution.nodeRuns[0]).toMatchObject({
      nodeId: 'node-a',
      status: 'SUCCESS',
    })
  })
})
