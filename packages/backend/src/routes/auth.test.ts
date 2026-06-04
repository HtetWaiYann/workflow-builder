import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import cookieParser from 'cookie-parser'
import request from 'supertest'
import authRouter from './auth'

vi.mock('../db/client', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('../services/auth', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-pw'),
  verifyPassword: vi.fn(),
  signToken: vi.fn().mockReturnValue('signed-token'),
  verifyToken: vi.fn(),
}))

import { prisma } from '../db/client'
import {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
} from '../services/auth'

const mockPrisma = vi.mocked(prisma)
const mockVerifyPassword = vi.mocked(verifyPassword)
const mockVerifyToken = vi.mocked(verifyToken)

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.use('/auth', authRouter)
  return app
}

const fakeWorkspace = {
  id: 'ws-1',
  name: "Test User's Workspace",
  createdAt: new Date('2024-01-01'),
}

const fakeUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  passwordHash: 'hashed-pw',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  memberships: [
    {
      role: 'OWNER',
      workspace: fakeWorkspace,
    },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.JWT_SECRET = 'test-secret'
})

// Registers a new user: hashes their password, creates a default workspace,
// and returns an httpOnly JWT cookie. Rejects invalid input and duplicate emails.
describe('POST /auth/register', () => {
  it('returns 400 when body is invalid', async () => {
    const res = await request(buildApp())
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'short' })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 409 when email is already taken', async () => {
    vi.mocked(mockPrisma.user.findUnique).mockResolvedValueOnce(
      fakeUser as never
    )

    const res = await request(buildApp())
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'Password123!' })

    expect(res.status).toBe(409)
    expect(res.body.code).toBe('EMAIL_TAKEN')
  })

  it('returns 201 and sets cookie on success', async () => {
    vi.mocked(mockPrisma.user.findUnique).mockResolvedValueOnce(null)
    vi.mocked(mockPrisma.$transaction).mockImplementationOnce(async (fn) => {
      const tx = {
        user: { create: vi.fn().mockResolvedValue(fakeUser) },
        workspace: { create: vi.fn().mockResolvedValue(fakeWorkspace) },
        workspaceMember: { create: vi.fn().mockResolvedValue({}) },
      }
      return (fn as (tx: unknown) => Promise<unknown>)(tx)
    })

    const res = await request(buildApp())
      .post('/auth/register')
      .send({ email: 'new@example.com', password: 'Password123!', name: 'New' })

    expect(res.status).toBe(201)
    expect(res.body.user.email).toBe('test@example.com')
    expect(res.headers['set-cookie']).toBeDefined()
    expect(signToken).toHaveBeenCalled()
    expect(hashPassword).toHaveBeenCalledWith('Password123!')
  })
})

// Authenticates an existing user by verifying their password hash and issuing
// a JWT cookie on success. Rejects malformed bodies and wrong credentials.
describe('POST /auth/login', () => {
  it('returns 400 when body is invalid', async () => {
    const res = await request(buildApp())
      .post('/auth/login')
      .send({ email: 'bad' })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 401 when user does not exist', async () => {
    vi.mocked(mockPrisma.user.findUnique).mockResolvedValueOnce(null)

    const res = await request(buildApp())
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' })

    expect(res.status).toBe(401)
    expect(res.body.code).toBe('INVALID_CREDENTIALS')
  })

  it('returns 401 when password is wrong', async () => {
    vi.mocked(mockPrisma.user.findUnique).mockResolvedValueOnce(
      fakeUser as never
    )
    mockVerifyPassword.mockResolvedValueOnce(false)

    const res = await request(buildApp())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'wrong-pw' })

    expect(res.status).toBe(401)
    expect(res.body.code).toBe('INVALID_CREDENTIALS')
  })

  it('returns 200 and sets cookie on success', async () => {
    vi.mocked(mockPrisma.user.findUnique).mockResolvedValueOnce(
      fakeUser as never
    )
    mockVerifyPassword.mockResolvedValueOnce(true)

    const res = await request(buildApp())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })

    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('test@example.com')
    expect(res.headers['set-cookie']).toBeDefined()
  })
})

// Ends the session by expiring the JWT cookie. No auth required — safe to call
// even when already unauthenticated.
describe('POST /auth/logout', () => {
  it('returns 200 and clears the cookie', async () => {
    const res = await request(buildApp()).post('/auth/logout')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    const setCookie = res.headers['set-cookie'] as unknown as
      | string[]
      | undefined
    expect(setCookie?.some((c) => c.startsWith('token=;'))).toBe(true)
  })
})

// Returns the authenticated user's profile and workspace. Fails fast when the
// cookie is missing, the token is invalid, or the user has since been deleted.
describe('GET /auth/me', () => {
  it('returns 401 when no token cookie is present', async () => {
    const res = await request(buildApp()).get('/auth/me')

    expect(res.status).toBe(401)
    expect(res.body.code).toBe('MISSING_TOKEN')
  })

  it('returns 401 when token is invalid', async () => {
    mockVerifyToken.mockImplementationOnce(() => {
      throw new Error('invalid token')
    })

    const res = await request(buildApp())
      .get('/auth/me')
      .set('Cookie', 'token=bad-token')

    expect(res.status).toBe(401)
    expect(res.body.code).toBe('INVALID_TOKEN')
  })

  it('returns 404 when user no longer exists', async () => {
    mockVerifyToken.mockReturnValueOnce({
      sub: 'user-1',
      email: 'test@example.com',
    })
    vi.mocked(mockPrisma.user.findUnique).mockResolvedValueOnce(null)

    const res = await request(buildApp())
      .get('/auth/me')
      .set('Cookie', 'token=valid-token')

    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })

  it('returns 200 with user data when authenticated', async () => {
    mockVerifyToken.mockReturnValueOnce({
      sub: 'user-1',
      email: 'test@example.com',
    })
    vi.mocked(mockPrisma.user.findUnique).mockResolvedValueOnce(
      fakeUser as never
    )

    const res = await request(buildApp())
      .get('/auth/me')
      .set('Cookie', 'token=valid-token')

    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('test@example.com')
    expect(res.body.workspaces[0].workspace.id).toBe('ws-1')
  })
})
