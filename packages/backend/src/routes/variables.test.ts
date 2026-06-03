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

vi.mock('../db/client', () => ({
  prisma: {
    workspaceVariable: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
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
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import express from 'express'
import request from 'supertest'
import { variablesRouter } from './variables'
import { prisma } from '../db/client'

const app = express()
app.use(express.json())
app.use('/workspace/variables', variablesRouter)

const NOW = new Date('2024-01-15T10:00:00.000Z')

const mockVariable = {
  id: 'var-1',
  key: 'MY_VAR',
  createdAt: NOW,
  updatedAt: NOW,
}

// Lists all variable keys for the workspace. Values are never returned in the response.
describe('GET /workspace/variables', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with a list of variable keys', async () => {
    vi.mocked(prisma.workspaceVariable.findMany).mockResolvedValue([
      mockVariable,
    ] as never)

    const res = await request(app).get('/workspace/variables')

    expect(res.status).toBe(200)
    expect(res.body.variables).toHaveLength(1)
    expect(res.body.variables[0].key).toBe('MY_VAR')
    expect(res.body.variables[0].id).toBe('var-1')
  })

  it('never includes encrypted value or raw value in the response', async () => {
    vi.mocked(prisma.workspaceVariable.findMany).mockResolvedValue([
      mockVariable,
    ] as never)

    const res = await request(app).get('/workspace/variables')

    expect(res.body.variables[0]).not.toHaveProperty('encryptedValue')
    expect(res.body.variables[0]).not.toHaveProperty('value')
    expect(res.body.variables[0]).not.toHaveProperty('iv')
    expect(res.body.variables[0]).not.toHaveProperty('authTag')
  })

  it('returns 200 with an empty array when no variables exist', async () => {
    vi.mocked(prisma.workspaceVariable.findMany).mockResolvedValue([])

    const res = await request(app).get('/workspace/variables')

    expect(res.status).toBe(200)
    expect(res.body.variables).toEqual([])
  })

  it('returns 500 on database error', async () => {
    vi.mocked(prisma.workspaceVariable.findMany).mockRejectedValue(
      new Error('db down')
    )

    const res = await request(app).get('/workspace/variables')

    expect(res.status).toBe(500)
    expect(res.body.code).toBe('INTERNAL_ERROR')
  })
})

// Creates a new encrypted workspace variable. Stores only the ciphertext — the
// plaintext value is never saved or returned. OWNER only.
describe('POST /workspace/variables', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a variable and returns 201 without the encrypted value', async () => {
    vi.mocked(prisma.workspaceVariable.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.workspaceVariable.create).mockResolvedValue(
      mockVariable as never
    )

    const res = await request(app)
      .post('/workspace/variables')
      .send({ key: 'MY_VAR', value: 'secret-value' })

    expect(res.status).toBe(201)
    expect(res.body.variable.key).toBe('MY_VAR')
    expect(res.body.variable).not.toHaveProperty('encryptedValue')
  })

  it('returns 400 when key is missing', async () => {
    const res = await request(app)
      .post('/workspace/variables')
      .send({ value: 'secret' })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 when key contains lowercase letters', async () => {
    const res = await request(app)
      .post('/workspace/variables')
      .send({ key: 'my_var', value: 'secret' })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 when value is empty', async () => {
    const res = await request(app)
      .post('/workspace/variables')
      .send({ key: 'MY_VAR', value: '' })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 409 when a variable with the same key already exists', async () => {
    vi.mocked(prisma.workspaceVariable.findUnique).mockResolvedValue({
      ...mockVariable,
      workspaceId: 'test-workspace-id',
    } as never)

    const res = await request(app)
      .post('/workspace/variables')
      .send({ key: 'MY_VAR', value: 'secret' })

    expect(res.status).toBe(409)
    expect(res.body.code).toBe('CONFLICT')
  })

  it('returns 500 on database error', async () => {
    vi.mocked(prisma.workspaceVariable.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.workspaceVariable.create).mockRejectedValue(
      new Error('db down')
    )

    const res = await request(app)
      .post('/workspace/variables')
      .send({ key: 'MY_VAR', value: 'secret' })

    expect(res.status).toBe(500)
    expect(res.body.code).toBe('INTERNAL_ERROR')
  })
})

// Updates the encrypted value of an existing variable. OWNER only.
describe('PUT /workspace/variables/:variableId', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates the variable and returns 200 without the encrypted value', async () => {
    vi.mocked(prisma.workspaceVariable.findFirst).mockResolvedValue({
      ...mockVariable,
      workspaceId: 'test-workspace-id',
    } as never)
    vi.mocked(prisma.workspaceVariable.update).mockResolvedValue(
      mockVariable as never
    )

    const res = await request(app)
      .put('/workspace/variables/var-1')
      .send({ value: 'new-secret' })

    expect(res.status).toBe(200)
    expect(res.body.variable.key).toBe('MY_VAR')
    expect(res.body.variable).not.toHaveProperty('encryptedValue')
  })

  it('returns 400 when value is missing', async () => {
    const res = await request(app).put('/workspace/variables/var-1').send({})

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 when value is an empty string', async () => {
    const res = await request(app)
      .put('/workspace/variables/var-1')
      .send({ value: '' })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 404 when the variable does not exist in this workspace', async () => {
    vi.mocked(prisma.workspaceVariable.findFirst).mockResolvedValue(null)

    const res = await request(app)
      .put('/workspace/variables/nonexistent')
      .send({ value: 'new-secret' })

    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })

  it('returns 500 on database error during update', async () => {
    vi.mocked(prisma.workspaceVariable.findFirst).mockResolvedValue({
      ...mockVariable,
      workspaceId: 'test-workspace-id',
    } as never)
    vi.mocked(prisma.workspaceVariable.update).mockRejectedValue(
      new Error('db down')
    )

    const res = await request(app)
      .put('/workspace/variables/var-1')
      .send({ value: 'new-secret' })

    expect(res.status).toBe(500)
    expect(res.body.code).toBe('INTERNAL_ERROR')
  })
})

// Permanently removes a workspace variable. OWNER only.
describe('DELETE /workspace/variables/:variableId', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes the variable and returns 204 with no body', async () => {
    vi.mocked(prisma.workspaceVariable.findFirst).mockResolvedValue({
      ...mockVariable,
      workspaceId: 'test-workspace-id',
    } as never)
    vi.mocked(prisma.workspaceVariable.delete).mockResolvedValue(
      mockVariable as never
    )

    const res = await request(app).delete('/workspace/variables/var-1')

    expect(res.status).toBe(204)
    expect(res.text).toBe('')
  })

  it('returns 404 when the variable does not exist in this workspace', async () => {
    vi.mocked(prisma.workspaceVariable.findFirst).mockResolvedValue(null)

    const res = await request(app).delete('/workspace/variables/nonexistent')

    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })

  it('returns 500 on database error during delete', async () => {
    vi.mocked(prisma.workspaceVariable.findFirst).mockResolvedValue({
      ...mockVariable,
      workspaceId: 'test-workspace-id',
    } as never)
    vi.mocked(prisma.workspaceVariable.delete).mockRejectedValue(
      new Error('db down')
    )

    const res = await request(app).delete('/workspace/variables/var-1')

    expect(res.status).toBe(500)
    expect(res.body.code).toBe('INTERNAL_ERROR')
  })
})
