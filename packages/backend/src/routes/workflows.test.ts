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
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('../lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import express from 'express'
import request from 'supertest'
import workflowRouter from './workflows'
import { prisma } from '../db/client'

const app = express()
app.use(express.json())
app.use('/workflows', workflowRouter)

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

const mockWorkflowSummary = {
  id: 'wf-1',
  workspaceId: 'test-workspace-id',
  name: 'Test Workflow',
  status: 'DRAFT' as const,
  createdAt: NOW,
  updatedAt: NOW,
}

describe('GET /workflows', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with an empty list when no workflows exist', async () => {
    vi.mocked(prisma.workflow.findMany).mockResolvedValue([])
    const res = await request(app).get('/workflows')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ workflows: [] })
  })

  it('returns workflow summaries without nodes or edges', async () => {
    vi.mocked(prisma.workflow.findMany).mockResolvedValue([
      mockWorkflowSummary,
    ] as never)
    const res = await request(app).get('/workflows')
    expect(res.status).toBe(200)
    expect(res.body.workflows).toHaveLength(1)
    expect(res.body.workflows[0]).toMatchObject({
      id: 'wf-1',
      name: 'Test Workflow',
    })
    expect(res.body.workflows[0].nodes).toBeUndefined()
    expect(res.body.workflows[0].edges).toBeUndefined()
  })

  it('returns 500 on unexpected database error', async () => {
    vi.mocked(prisma.workflow.findMany).mockRejectedValue(new Error('db down'))
    const res = await request(app).get('/workflows')
    expect(res.status).toBe(500)
    expect(res.body.code).toBe('INTERNAL_ERROR')
  })
})

describe('POST /workflows', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a workflow and returns 201 with nodes and edges', async () => {
    vi.mocked(prisma.workflow.create).mockResolvedValue(mockWorkflow as never)
    const res = await request(app)
      .post('/workflows')
      .send({ name: 'Test Workflow' })
    expect(res.status).toBe(201)
    expect(res.body.workflow).toMatchObject({
      name: 'Test Workflow',
      status: 'DRAFT',
    })
    expect(res.body.workflow.nodes).toEqual([])
    expect(res.body.workflow.edges).toEqual([])
  })

  it('returns 400 when name is missing', async () => {
    const res = await request(app).post('/workflows').send({})
    expect(res.status).toBe(400)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 when name is an empty string', async () => {
    const res = await request(app).post('/workflows').send({ name: '' })
    expect(res.status).toBe(400)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })
})

describe('GET /workflows/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with the full workflow including nodes and edges', async () => {
    vi.mocked(prisma.workflow.findFirst).mockResolvedValue(
      mockWorkflow as never
    )
    const res = await request(app).get('/workflows/wf-1')
    expect(res.status).toBe(200)
    expect(res.body.workflow.id).toBe('wf-1')
    expect(Array.isArray(res.body.workflow.nodes)).toBe(true)
  })

  it('returns 404 when workflow does not exist', async () => {
    vi.mocked(prisma.workflow.findFirst).mockResolvedValue(null)
    const res = await request(app).get('/workflows/nonexistent')
    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })
})

describe('PATCH /workflows/:id (rename)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renames the workflow and returns 200', async () => {
    vi.mocked(prisma.workflow.findFirst).mockResolvedValue(
      mockWorkflow as never
    )
    vi.mocked(prisma.workflow.update).mockResolvedValue({
      ...mockWorkflowSummary,
      name: 'Renamed',
    } as never)
    const res = await request(app)
      .patch('/workflows/wf-1')
      .send({ name: 'Renamed' })
    expect(res.status).toBe(200)
    expect(res.body.workflow.name).toBe('Renamed')
    expect(res.body.workflow.nodes).toBeUndefined()
  })

  it('returns 404 when workflow does not exist', async () => {
    vi.mocked(prisma.workflow.findFirst).mockResolvedValue(null)
    const res = await request(app).patch('/workflows/wf-1').send({ name: 'X' })
    expect(res.status).toBe(404)
  })

  it('returns 400 for an empty name', async () => {
    const res = await request(app).patch('/workflows/wf-1').send({ name: '' })
    expect(res.status).toBe(400)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })
})

describe('PUT /workflows/:id/graph', () => {
  beforeEach(() => vi.clearAllMocks())

  const validNode = {
    id: 'n1',
    type: 'no-op',
    position: { x: 0, y: 0 },
    data: {},
  }

  it('saves nodes and edges and returns 200', async () => {
    vi.mocked(prisma.workflow.findFirst).mockResolvedValue(
      mockWorkflow as never
    )
    vi.mocked(prisma.workflow.update).mockResolvedValue({
      ...mockWorkflow,
      nodes: [validNode],
    } as never)
    const res = await request(app)
      .put('/workflows/wf-1/graph')
      .send({ nodes: [validNode], edges: [] })
    expect(res.status).toBe(200)
    expect(res.body.workflow.nodes).toHaveLength(1)
  })

  it('returns 404 when workflow does not exist', async () => {
    vi.mocked(prisma.workflow.findFirst).mockResolvedValue(null)
    const res = await request(app)
      .put('/workflows/wf-1/graph')
      .send({ nodes: [], edges: [] })
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid body shape', async () => {
    const res = await request(app)
      .put('/workflows/wf-1/graph')
      .send({ nodes: 'not-an-array' })
    expect(res.status).toBe(400)
  })
})

describe('POST /workflows/:id/activate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sets status to ACTIVE and returns 200', async () => {
    vi.mocked(prisma.workflow.findFirst).mockResolvedValue(
      mockWorkflow as never
    )
    vi.mocked(prisma.workflow.update).mockResolvedValue({
      ...mockWorkflowSummary,
      status: 'ACTIVE',
    } as never)
    const res = await request(app).post('/workflows/wf-1/activate')
    expect(res.status).toBe(200)
    expect(res.body.workflow.status).toBe('ACTIVE')
  })

  it('returns 404 when workflow does not exist', async () => {
    vi.mocked(prisma.workflow.findFirst).mockResolvedValue(null)
    const res = await request(app).post('/workflows/wf-1/activate')
    expect(res.status).toBe(404)
  })
})

describe('POST /workflows/:id/deactivate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sets status to INACTIVE and returns 200', async () => {
    vi.mocked(prisma.workflow.findFirst).mockResolvedValue(
      mockWorkflow as never
    )
    vi.mocked(prisma.workflow.update).mockResolvedValue({
      ...mockWorkflowSummary,
      status: 'INACTIVE',
    } as never)
    const res = await request(app).post('/workflows/wf-1/deactivate')
    expect(res.status).toBe(200)
    expect(res.body.workflow.status).toBe('INACTIVE')
  })
})

describe('POST /workflows/:id/duplicate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a copy with "(copy)" suffix and returns 201', async () => {
    vi.mocked(prisma.workflow.findFirst).mockResolvedValue(
      mockWorkflow as never
    )
    vi.mocked(prisma.workflow.create).mockResolvedValue({
      ...mockWorkflow,
      id: 'wf-copy',
      name: 'Test Workflow (copy)',
    } as never)
    const res = await request(app).post('/workflows/wf-1/duplicate')
    expect(res.status).toBe(201)
    expect(res.body.workflow.name).toBe('Test Workflow (copy)')
    expect(res.body.workflow.status).toBe('DRAFT')
  })

  it('returns 404 when source workflow does not exist', async () => {
    vi.mocked(prisma.workflow.findFirst).mockResolvedValue(null)
    const res = await request(app).post('/workflows/wf-1/duplicate')
    expect(res.status).toBe(404)
  })
})

describe('DELETE /workflows/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes the workflow and returns 204', async () => {
    vi.mocked(prisma.workflow.findFirst).mockResolvedValue(
      mockWorkflow as never
    )
    vi.mocked(prisma.workflow.delete).mockResolvedValue(mockWorkflow as never)
    const res = await request(app).delete('/workflows/wf-1')
    expect(res.status).toBe(204)
    expect(res.text).toBe('')
  })

  it('returns 404 when workflow does not exist', async () => {
    vi.mocked(prisma.workflow.findFirst).mockResolvedValue(null)
    const res = await request(app).delete('/workflows/wf-1')
    expect(res.status).toBe(404)
  })
})
