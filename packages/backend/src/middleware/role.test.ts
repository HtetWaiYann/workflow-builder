import { describe, it, expect, vi } from 'vitest'
import type { Response, NextFunction } from 'express'
import { requireRole } from './role'
import type { AuthRequest } from './auth'

function makeReq(role?: string): AuthRequest {
  return { memberRole: role } as unknown as AuthRequest
}

function makeRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }
  return res as unknown as Response
}

// Role gate middleware. Must run after requireWorkspace, which sets memberRole.
// Responds 403 when the member's role is not in the allowed list.
describe('requireRole', () => {
  it('calls next when the member role matches the single allowed role', () => {
    const next = vi.fn() as NextFunction
    requireRole('OWNER')(makeReq('OWNER'), makeRes(), next)
    expect(next).toHaveBeenCalledOnce()
  })

  it('calls next when the role matches one of several allowed roles', () => {
    const next = vi.fn() as NextFunction
    requireRole('OWNER', 'EDITOR')(makeReq('EDITOR'), makeRes(), next)
    expect(next).toHaveBeenCalledOnce()
  })

  it('responds 403 FORBIDDEN when the role is not in the allowed list', () => {
    const res = makeRes()
    const next = vi.fn() as NextFunction
    requireRole('OWNER')(makeReq('VIEWER'), res, next)

    expect(vi.mocked(res.status)).toHaveBeenCalledWith(403)
    expect(vi.mocked(res.json)).toHaveBeenCalledWith({
      error: 'Insufficient permissions',
      code: 'FORBIDDEN',
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('responds 403 FORBIDDEN when memberRole is undefined', () => {
    const res = makeRes()
    const next = vi.fn() as NextFunction
    requireRole('OWNER')(makeReq(undefined), res, next)

    expect(vi.mocked(res.status)).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('does not call next when role is present but wrong', () => {
    const next = vi.fn() as NextFunction
    requireRole('OWNER', 'EDITOR')(makeReq('VIEWER'), makeRes(), next)
    expect(next).not.toHaveBeenCalled()
  })
})
