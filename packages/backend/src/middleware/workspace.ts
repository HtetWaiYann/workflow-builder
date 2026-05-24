import type { Response, NextFunction } from 'express'
import { prisma } from '../db/client'
import type { AuthRequest } from './auth'

/**
 * Express middleware that looks up the workspace for the authenticated user
 * and attaches `workspaceId` to the request.
 * Must run after `requireAuth`.
 * Responds with 403 if the user has no workspace.
 */
export async function requireWorkspace(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const workspace = await prisma.workspace.findUnique({
    where: { userId: req.userId },
    select: { id: true },
  })

  if (!workspace) {
    res.status(403).json({ error: 'No workspace found', code: 'NO_WORKSPACE' })
    return
  }

  req.workspaceId = workspace.id
  next()
}
