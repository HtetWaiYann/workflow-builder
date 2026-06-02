import type { Response, NextFunction } from 'express'
import type { AuthRequest } from './auth'

/**
 * Returns middleware that allows only requests whose `memberRole` (set by
 * `requireWorkspace`) matches one of the given roles. Must run after
 * `requireWorkspace`.
 *
 * @param roles - One or more allowed role strings ('OWNER', 'EDITOR', 'VIEWER').
 * @returns Express middleware that responds 403 when the role is insufficient.
 */
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.memberRole || !roles.includes(req.memberRole)) {
      res
        .status(403)
        .json({ error: 'Insufficient permissions', code: 'FORBIDDEN' })
      return
    }
    next()
  }
}
