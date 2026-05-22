import { Router } from 'express'
import type { Response } from 'express'
import { logger } from '../lib/logger'
import { prisma } from '../db/client'
import { hashPassword, verifyPassword, signToken } from '../services/auth'
import {
  RegisterRequestSchema,
  LoginRequestSchema,
} from '@workflow-builder/shared'
import { requireAuth } from '../middleware/auth'
import type { AuthRequest } from '../middleware/auth'

const router = Router()

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
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
  userId: string
  createdAt: Date
}) => ({
  id: ws.id,
  name: ws.name,
  userId: ws.userId,
  createdAt: ws.createdAt.toISOString(),
})

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

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name ?? null,
        workspace: { create: { name: workspaceName } },
      },
      include: { workspace: true },
    })

    const token = signToken({ id: user.id, email: user.email })
    res.cookie('token', token, COOKIE_OPTIONS)

    res.status(201).json({
      user: formatUser(user),
      workspace: user.workspace ? formatWorkspace(user.workspace) : null,
    })
  } catch (error) {
    logger.error({ err: error }, 'Registration error')
    res
      .status(500)
      .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

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
      include: { workspace: true },
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
      workspace: user.workspace ? formatWorkspace(user.workspace) : null,
    })
  } catch {
    res
      .status(500)
      .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

router.post('/logout', (_req, res: Response) => {
  res.clearCookie('token')
  res.json({ success: true })
})

router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { workspace: true },
    })

    if (!user) {
      res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' })
      return
    }

    res.json({
      user: formatUser(user),
      workspace: user.workspace ? formatWorkspace(user.workspace) : null,
    })
  } catch {
    res
      .status(500)
      .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

export default router
