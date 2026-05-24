import { vi, describe, it, expect } from 'vitest'
import type { Response, NextFunction } from 'express'
import { requireAuth } from './auth'
import type { AuthRequest } from './auth'
import { signToken } from '../services/auth'

function makeReq(cookies: Record<string, string> = {}): AuthRequest {
  return { cookies } as unknown as AuthRequest
}

function makeRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }
  return res as unknown as Response
}

describe('requireAuth', () => {
  it('attaches userId and userEmail then calls next for a valid token cookie', () => {
    const token = signToken({ id: 'user-1', email: 'user@test.com' })
    const req = makeReq({ token })
    const next = vi.fn() as NextFunction

    requireAuth(req, makeRes(), next)

    expect(next).toHaveBeenCalledOnce()
    expect(req.userId).toBe('user-1')
    expect(req.userEmail).toBe('user@test.com')
  })

  it('returns 401 MISSING_TOKEN when no cookie is present', () => {
    const req = makeReq()
    const res = makeRes()
    const next = vi.fn() as NextFunction

    requireAuth(req, res, next)

    expect(res.status as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(401)
    expect(res.json as ReturnType<typeof vi.fn>).toHaveBeenCalledWith({
      error: 'Unauthorized',
      code: 'MISSING_TOKEN',
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 INVALID_TOKEN for a malformed token', () => {
    const req = makeReq({ token: 'not.a.jwt' })
    const res = makeRes()
    const next = vi.fn() as NextFunction

    requireAuth(req, res, next)

    expect(res.status as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(401)
    expect(res.json as ReturnType<typeof vi.fn>).toHaveBeenCalledWith({
      error: 'Unauthorized',
      code: 'INVALID_TOKEN',
    })
    expect(next).not.toHaveBeenCalled()
  })
})
