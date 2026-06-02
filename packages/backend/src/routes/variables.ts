import { Router } from 'express'
import type { Response } from 'express'
import {
  CreateWorkspaceVariableRequestSchema,
  UpdateWorkspaceVariableRequestSchema,
} from '@workflow-builder/shared'
import { prisma } from '../db/client'
import { requireAuth } from '../middleware/auth'
import type { AuthRequest } from '../middleware/auth'
import { requireWorkspace } from '../middleware/workspace'
import { requireRole } from '../middleware/role'
import { encrypt } from '../services/encryptionService'
import { logger } from '../lib/logger'

export const variablesRouter = Router()

variablesRouter.use(requireAuth)
variablesRouter.use(requireWorkspace)

// GET /workspace/variables — Lists all variable keys for the workspace. Values are never returned.
variablesRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const variables = await prisma.workspaceVariable.findMany({
      where: { workspaceId: req.workspaceId! },
      select: { id: true, key: true, createdAt: true, updatedAt: true },
      orderBy: { key: 'asc' },
    })
    res.json({ variables })
  } catch (err) {
    logger.error({ err }, 'Failed to list workspace variables')
    res
      .status(500)
      .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// POST /workspace/variables — Creates a new encrypted workspace variable. OWNER only.
variablesRouter.post(
  '/',
  requireRole('OWNER'),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = CreateWorkspaceVariableRequestSchema.safeParse(req.body)
      if (!result.success) {
        res.status(400).json({
          error: result.error.issues[0]?.message ?? 'Invalid request',
          code: 'VALIDATION_ERROR',
        })
        return
      }

      const { key, value } = result.data
      const existing = await prisma.workspaceVariable.findUnique({
        where: { workspaceId_key: { workspaceId: req.workspaceId!, key } },
      })
      if (existing) {
        res
          .status(409)
          .json({ error: `Variable '${key}' already exists`, code: 'CONFLICT' })
        return
      }

      const { encryptedValue, iv, authTag } = encrypt(value)
      const variable = await prisma.workspaceVariable.create({
        data: {
          workspaceId: req.workspaceId!,
          key,
          encryptedValue,
          iv,
          authTag,
        },
        select: { id: true, key: true, createdAt: true, updatedAt: true },
      })

      res.status(201).json({ variable })
    } catch (err) {
      logger.error({ err }, 'Failed to create workspace variable')
      res
        .status(500)
        .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  }
)

// PUT /workspace/variables/:variableId — Updates the encrypted value of an existing variable. OWNER only.
variablesRouter.put(
  '/:variableId',
  requireRole('OWNER'),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = UpdateWorkspaceVariableRequestSchema.safeParse(req.body)
      if (!result.success) {
        res.status(400).json({
          error: result.error.issues[0]?.message ?? 'Invalid request',
          code: 'VALIDATION_ERROR',
        })
        return
      }

      const existing = await prisma.workspaceVariable.findFirst({
        where: { id: req.params.variableId, workspaceId: req.workspaceId! },
      })
      if (!existing) {
        res.status(404).json({ error: 'Variable not found', code: 'NOT_FOUND' })
        return
      }

      const { encryptedValue, iv, authTag } = encrypt(result.data.value)
      const variable = await prisma.workspaceVariable.update({
        where: { id: req.params.variableId },
        data: { encryptedValue, iv, authTag },
        select: { id: true, key: true, createdAt: true, updatedAt: true },
      })

      res.json({ variable })
    } catch (err) {
      logger.error({ err }, 'Failed to update workspace variable')
      res
        .status(500)
        .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  }
)

// DELETE /workspace/variables/:variableId — Permanently removes a workspace variable. OWNER only.
variablesRouter.delete(
  '/:variableId',
  requireRole('OWNER'),
  async (req: AuthRequest, res: Response) => {
    try {
      const existing = await prisma.workspaceVariable.findFirst({
        where: { id: req.params.variableId, workspaceId: req.workspaceId! },
      })
      if (!existing) {
        res.status(404).json({ error: 'Variable not found', code: 'NOT_FOUND' })
        return
      }

      await prisma.workspaceVariable.delete({
        where: { id: req.params.variableId },
      })
      res.status(204).send()
    } catch (err) {
      logger.error({ err }, 'Failed to delete workspace variable')
      res
        .status(500)
        .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  }
)
