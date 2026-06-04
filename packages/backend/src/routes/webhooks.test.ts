import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../db/client', () => ({
  prisma: {
    workflow: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
    workflowNodeSecret: {
      findUnique: vi.fn(),
    },
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
import { webhooksRouter } from './webhooks'
import { prisma } from '../db/client'
import { runWorkflow } from '../engine/runner'

const app = express()
app.use(express.json())
app.use('/webhooks', webhooksRouter)

const NOW = new Date('2024-01-15T10:00:00.000Z')

const mockExecution = {
  id: 'exec-1',
  workflowId: 'wf-1',
  status: 'PENDING',
  inputData: null,
  startedAt: null,
  finishedAt: null,
  createdAt: NOW,
}

const webhookTriggerNode = {
  id: 'node-1',
  type: 'webhook-trigger',
  position: { x: 0, y: 0 },
  data: { config: { path: '/my-hook' } },
}

const mockActiveWorkflow = {
  id: 'wf-1',
  workspaceId: 'ws-1',
  name: 'Webhook Workflow',
  status: 'ACTIVE',
  nodes: [webhookTriggerNode],
  edges: [],
  createdAt: NOW,
  updatedAt: NOW,
}

function mockTransaction() {
  vi.mocked(
    prisma.$transaction as unknown as (fn: unknown) => Promise<unknown>
  ).mockImplementation(async (fn) => {
    if (typeof fn === 'function') {
      const tx = {
        execution: { create: vi.fn().mockResolvedValue(mockExecution) },
        executionNodeRun: {
          createMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      }
      return (fn as (tx: unknown) => Promise<unknown>)(tx)
    }
    return []
  })
}

// Receives an inbound webhook and fires all matching ACTIVE workflows in parallel.
// Publicly accessible — no authentication required.
describe('POST /webhooks/:webhookPath', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 when the webhook path contains invalid characters', async () => {
    const res = await request(app)
      .post('/webhooks/bad path!')
      .send({ data: 'test' })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 202 silently when no workflows match the webhook path', async () => {
    vi.mocked(prisma.workflow.findMany).mockResolvedValue([
      mockActiveWorkflow,
    ] as never)

    const res = await request(app)
      .post('/webhooks/unregistered-path')
      .send({ event: 'test' })

    expect(res.status).toBe(202)
    expect(res.body.message).toBe('Accepted')
    expect(runWorkflow).not.toHaveBeenCalled()
  })

  it('returns 202 and triggers the matching workflow', async () => {
    vi.mocked(prisma.workflow.findMany).mockResolvedValue([
      mockActiveWorkflow,
    ] as never)
    mockTransaction()

    const res = await request(app)
      .post('/webhooks/my-hook')
      .send({ event: 'order.created' })

    expect(res.status).toBe(202)
    expect(res.body.message).toBe('Accepted')
  })

  it('fires runWorkflow as fire-and-forget after the transaction', async () => {
    vi.mocked(prisma.workflow.findMany).mockResolvedValue([
      mockActiveWorkflow,
    ] as never)
    mockTransaction()

    await request(app)
      .post('/webhooks/my-hook')
      .send({ event: 'order.created' })

    expect(runWorkflow).toHaveBeenCalledWith(
      'exec-1',
      [webhookTriggerNode],
      [],
      expect.objectContaining({ body: { event: 'order.created' } })
    )
  })

  it('never exposes execution IDs in the response body', async () => {
    vi.mocked(prisma.workflow.findMany).mockResolvedValue([
      mockActiveWorkflow,
    ] as never)
    mockTransaction()

    const res = await request(app).post('/webhooks/my-hook').send({})

    expect(JSON.stringify(res.body)).not.toContain('exec-1')
    expect(JSON.stringify(res.body)).not.toContain('executionId')
  })

  it('strips authorization and cookie headers from the stored input data', async () => {
    vi.mocked(prisma.workflow.findMany).mockResolvedValue([
      mockActiveWorkflow,
    ] as never)

    let capturedInputData: Record<string, unknown> | undefined
    vi.mocked(
      prisma.$transaction as unknown as (fn: unknown) => Promise<unknown>
    ).mockImplementation(async (fn) => {
      if (typeof fn === 'function') {
        const tx = {
          execution: {
            create: vi
              .fn()
              .mockImplementation(
                async (args: {
                  data: { inputData: Record<string, unknown> }
                }) => {
                  capturedInputData = args.data.inputData as Record<
                    string,
                    unknown
                  >
                  return mockExecution
                }
              ),
          },
          executionNodeRun: {
            createMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        }
        return (fn as (tx: unknown) => Promise<unknown>)(tx)
      }
      return []
    })

    await request(app)
      .post('/webhooks/my-hook')
      .set('authorization', 'Bearer secret-token')
      .set('cookie', 'session=abc')
      .send({})

    const headers = capturedInputData?.['headers'] as Record<string, unknown>
    expect(headers).toBeDefined()
    expect(headers['authorization']).toBeUndefined()
    expect(headers['cookie']).toBeUndefined()
  })

  it('returns 202 with no match when no ACTIVE workflows exist', async () => {
    vi.mocked(prisma.workflow.findMany).mockResolvedValue([])

    const res = await request(app).post('/webhooks/my-hook').send({})

    expect(res.status).toBe(202)
    expect(runWorkflow).not.toHaveBeenCalled()
  })

  it('triggers multiple matching workflows in parallel when they share the same path', async () => {
    const secondWorkflow = {
      ...mockActiveWorkflow,
      id: 'wf-2',
    }
    vi.mocked(prisma.workflow.findMany).mockResolvedValue([
      mockActiveWorkflow,
      secondWorkflow,
    ] as never)

    let txCallCount = 0
    vi.mocked(
      prisma.$transaction as unknown as (fn: unknown) => Promise<unknown>
    ).mockImplementation(async (fn) => {
      if (typeof fn === 'function') {
        txCallCount++
        const tx = {
          execution: {
            create: vi.fn().mockResolvedValue({
              ...mockExecution,
              id: `exec-${txCallCount}`,
            }),
          },
          executionNodeRun: {
            createMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        }
        return (fn as (tx: unknown) => Promise<unknown>)(tx)
      }
      return []
    })

    await request(app).post('/webhooks/my-hook').send({})

    expect(txCallCount).toBe(2)
    expect(runWorkflow).toHaveBeenCalledTimes(2)
  })

  it('returns 500 on unexpected database error', async () => {
    vi.mocked(prisma.workflow.findMany).mockRejectedValue(new Error('db down'))

    const res = await request(app).post('/webhooks/my-hook').send({})

    expect(res.status).toBe(500)
    expect(res.body.code).toBe('INTERNAL_ERROR')
  })
})
