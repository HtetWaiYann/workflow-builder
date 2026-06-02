import type { Response, NextFunction } from 'express'
import { prisma } from '../db/client'
import type { AuthRequest } from './auth'

/**
 * Express middleware that verifies the authenticated user is a member of the
 * workspace identified by the `X-Workspace-ID` request header, then attaches
 * `workspaceId` and `memberRole` to the request object.
 *
 * Must run after `requireAuth`.
 *
 * @throws 400 if the header is absent.
 * @throws 403 if the user has no membership in the given workspace.
 */
export async function requireWorkspace(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const workspaceId = req.headers['x-workspace-id'] as string | undefined

  if (!workspaceId) {
    res
      .status(400)
      .json({
        error: 'X-Workspace-ID header is required',
        code: 'MISSING_WORKSPACE',
      })
    return
  }

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: req.userId! } },
    select: { role: true },
  })

  if (!member) {
    res
      .status(403)
      .json({ error: 'No access to this workspace', code: 'FORBIDDEN' })
    return
  }

  req.workspaceId = workspaceId
  req.memberRole = member.role
  next()
}
