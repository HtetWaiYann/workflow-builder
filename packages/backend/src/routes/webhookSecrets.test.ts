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
    req['memberRole'] = 'OWNER'
    next()
  },
}))

vi.mock('../middleware/role', () => ({
  requireRole:
    (..._roles: string[]) =>
    (_req: unknown, _res: unknown, next: () => void) =>
      next(),
}))

vi.mock('../db/client', () => ({
  prisma: {
    workflow: {
      findFirst: vi.fn(),
    },
    workflowNodeSecret: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('../services/encryptionService', () => ({
  encrypt: vi.fn().mockReturnValue({
    encryptedValue: 'enc-abc',
    iv: 'test-iv',
    authTag: 'test-auth-tag',
  }),
}))

vi.mock('../lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

import express from 'express'
import request from 'supertest'
import { webhookSecretsRouter } from './webhookSecrets'
import { prisma } from '../db/client'

const app = express()
app.use(express.json())
app.use('/workflows/:workflowId/nodes/:nodeId/secret', webhookSecretsRouter)

const mockWorkflow = { id: 'wf-1' }

const NOW = new Date('2024-01-15T10:00:00.000Z')
const mockSecret = {
  id: 'sec-1',
  workflowId: 'wf-1',
  nodeId: 'node-1',
  encryptedValue: 'enc-abc',
  iv: 'test-iv',
  authTag: 'test-auth-tag',
  hint: 'abcd••••••••efgh',
  createdAt: NOW,
  updatedAt: NOW,
}

// HMAC secret management for webhook trigger nodes.
// The plaintext is returned once on generation and never stored — only an
// encrypted copy and a 4-char masked hint are persisted.
describe('GET /workflows/:workflowId/nodes/:nodeId/secret', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns exists: false and null hint when no secret is configured', async () => {
    vi.mocked(prisma.workflow.findFirst).mockResolvedValue(
      mockWorkflow as never
    )
    vi.mocked(prisma.workflowNodeSecret.findUnique).mockResolvedValue(null)

    const res = await request(app).get('/workflows/wf-1/nodes/node-1/secret')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ exists: false, hint: null })
  })

  it('returns exists: true and the masked hint when a secret exists', async () => {
    vi.mocked(prisma.workflow.findFirst).mockResolvedValue(
      mockWorkflow as never
    )
    vi.mocked(prisma.workflowNodeSecret.findUnique).mockResolvedValue(
      mockSecret as never
    )

    const res = await request(app).get('/workflows/wf-1/nodes/node-1/secret')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ exists: true, hint: mockSecret.hint })
  })

  it('returns 404 when the workflow does not belong to the workspace', async () => {
    vi.mocked(prisma.workflow.findFirst).mockResolvedValue(null)

    const res = await request(app).get('/workflows/wf-1/nodes/node-1/secret')

    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })
})

describe('POST /workflows/:workflowId/nodes/:nodeId/secret', () => {
  beforeEach(() => vi.clearAllMocks())

  it('generates a new secret and returns the plaintext and masked hint', async () => {
    vi.mocked(prisma.workflow.findFirst).mockResolvedValue(
      mockWorkflow as never
    )
    vi.mocked(prisma.workflowNodeSecret.upsert).mockResolvedValue(
      mockSecret as never
    )

    const res = await request(app).post('/workflows/wf-1/nodes/node-1/secret')

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('secret')
    expect(res.body).toHaveProperty('hint')
    // Plaintext is 32 random bytes encoded as hex
    expect(res.body.secret).toHaveLength(64)
  })

  it('upserts the secret so repeated calls invalidate the previous one', async () => {
    vi.mocked(prisma.workflow.findFirst).mockResolvedValue(
      mockWorkflow as never
    )
    vi.mocked(prisma.workflowNodeSecret.upsert).mockResolvedValue(
      mockSecret as never
    )

    await request(app).post('/workflows/wf-1/nodes/node-1/secret')

    expect(vi.mocked(prisma.workflowNodeSecret.upsert)).toHaveBeenCalledOnce()
  })

  it('returns 404 when the workflow does not belong to the workspace', async () => {
    vi.mocked(prisma.workflow.findFirst).mockResolvedValue(null)

    const res = await request(app).post('/workflows/wf-1/nodes/node-1/secret')

    expect(res.status).toBe(404)
  })
})

describe('DELETE /workflows/:workflowId/nodes/:nodeId/secret', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes the secret and returns 204 No Content', async () => {
    vi.mocked(prisma.workflow.findFirst).mockResolvedValue(
      mockWorkflow as never
    )
    vi.mocked(prisma.workflowNodeSecret.findUnique).mockResolvedValue(
      mockSecret as never
    )
    vi.mocked(prisma.workflowNodeSecret.delete).mockResolvedValue(
      mockSecret as never
    )

    const res = await request(app).delete('/workflows/wf-1/nodes/node-1/secret')

    expect(res.status).toBe(204)
  })

  it('returns 404 NOT_FOUND when no secret is configured', async () => {
    vi.mocked(prisma.workflow.findFirst).mockResolvedValue(
      mockWorkflow as never
    )
    vi.mocked(prisma.workflowNodeSecret.findUnique).mockResolvedValue(null)

    const res = await request(app).delete('/workflows/wf-1/nodes/node-1/secret')

    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })

  it('returns 404 when the workflow does not belong to the workspace', async () => {
    vi.mocked(prisma.workflow.findFirst).mockResolvedValue(null)

    const res = await request(app).delete('/workflows/wf-1/nodes/node-1/secret')

    expect(res.status).toBe(404)
  })
})
