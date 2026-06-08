import { Router } from 'express'
import type { Response } from 'express'
import { logger } from '../lib/logger'
import { prisma } from '../db/client'
import { hashPassword, verifyPassword, signToken } from '../services/auth'
import {
  RegisterRequestSchema,
  LoginRequestSchema,
} from '@triggr/shared'
import { requireAuth } from '../middleware/auth'
import type { AuthRequest } from '../middleware/auth'

const router = Router()

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

const formatUser = (user: {
  id: string
  email: string
  name: string | null
  createdAt: Date
}) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  createdAt: user.createdAt.toISOString(),
})

const formatWorkspace = (ws: {
  id: string
  name: string
  createdAt: Date
}) => ({
  id: ws.id,
  name: ws.name,
  createdAt: ws.createdAt.toISOString(),
})

type MembershipRow = {
  role: string
  workspace: { id: string; name: string; createdAt: Date }
}

const formatMemberships = (memberships: MembershipRow[]) =>
  memberships.map((m) => ({
    workspace: formatWorkspace(m.workspace),
    role: m.role,
  }))

// POST /auth/register — Creates a new user account, provisions a default workspace,
// adds the user as OWNER, and responds with an httpOnly JWT cookie on success.
router.post('/register', async (req, res: Response) => {
  try {
    const result = RegisterRequestSchema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: result.error.issues,
      })
      return
    }

    const { email, password, name } = result.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      res
        .status(409)
        .json({ error: 'Email already in use', code: 'EMAIL_TAKEN' })
      return
    }

    const passwordHash = await hashPassword(password)
    const workspaceName = `${name ?? email.split('@')[0]}'s Workspace`

    const { user, workspace } = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { email, passwordHash, name: name ?? null },
      })
      const newWorkspace = await tx.workspace.create({
        data: { name: workspaceName },
      })
      await tx.workspaceMember.create({
        data: {
          userId: newUser.id,
          workspaceId: newWorkspace.id,
          role: 'OWNER',
        },
      })
      return { user: newUser, workspace: newWorkspace }
    })

    const token = signToken({ id: user.id, email: user.email })
    res.cookie('token', token, COOKIE_OPTIONS)

    res.status(201).json({
      user: formatUser(user),
      workspaces: [{ workspace: formatWorkspace(workspace), role: 'OWNER' }],
    })
  } catch (error) {
    logger.error({ err: error }, 'Registration error')
    res
      .status(500)
      .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// POST /auth/login — Verifies email and password against the stored bcrypt hash,
// issues a JWT cookie on success, and returns all workspaces the user belongs to.
router.post('/login', async (req, res: Response) => {
  try {
    const result = LoginRequestSchema.safeParse(req.body)
    if (!result.success) {
      res
        .status(400)
        .json({ error: 'Validation failed', code: 'VALIDATION_ERROR' })
      return
    }

    const { email, password } = result.data

    const user = await prisma.user.findUnique({
      where: { email },
      include: { memberships: { include: { workspace: true } } },
    })

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      res
        .status(401)
        .json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' })
      return
    }

    const token = signToken({ id: user.id, email: user.email })
    res.cookie('token', token, COOKIE_OPTIONS)

    res.json({
      user: formatUser(user),
      workspaces: formatMemberships(user.memberships),
    })
  } catch {
    res
      .status(500)
      .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// POST /auth/logout — Expires the JWT cookie to end the session.
router.post('/logout', (_req, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  })
  res.json({ success: true })
})

// GET /auth/me — Returns the authenticated user's profile and all their workspace memberships.
// Used on page load to restore an existing session.
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { memberships: { include: { workspace: true } } },
    })

    if (!user) {
      res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' })
      return
    }

    res.json({
      user: formatUser(user),
      workspaces: formatMemberships(user.memberships),
    })
  } catch {
    res
      .status(500)
      .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

export default router
