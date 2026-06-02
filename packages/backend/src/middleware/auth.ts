import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../services/auth'

export interface AuthRequest extends Request {
  userId?: string
  userEmail?: string
  workspaceId?: string
  /** WorkspaceMemberRole value set by requireWorkspace after verifying membership. */
  memberRole?: string
}

/**
 * Express middleware that reads the `token` httpOnly cookie, verifies it,
 * and attaches `userId` and `userEmail` to the request.
 * Responds with 401 if the cookie is absent or the token is invalid.
 */
export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const token = (req.cookies as Record<string, string | undefined>)?.token

  if (!token) {
    res.status(401).json({ error: 'Unauthorized', code: 'MISSING_TOKEN' })
    return
  }

  try {
    const payload = verifyToken(token)
    req.userId = payload.sub
    req.userEmail = payload.email
    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized', code: 'INVALID_TOKEN' })
  }
}
