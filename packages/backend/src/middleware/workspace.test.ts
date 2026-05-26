import { vi, describe, it, expect } from 'vitest'

vi.mock('../db/client', () => ({
  prisma: {
    workspace: {
      findUnique: vi.fn(),
    },
  },
}))

import type { Response, NextFunction } from 'express'
import { requireWorkspace } from './workspace'
import { prisma } from '../db/client'
import type { AuthRequest } from './auth'

function makeReq(userId = 'user-1'): AuthRequest {
  return { userId } as unknown as AuthRequest
}

function makeRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }
  return res as unknown as Response
}

// Looks up the workspace for the authenticated user and attaches its id to the request.
// Returns 403 NO_WORKSPACE when the user has no workspace record in the database.
describe('requireWorkspace', () => {
  it('attaches workspaceId and calls next when workspace exists', async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
      id: 'ws-1',
    } as never)
    const req = makeReq()
    const next = vi.fn() as NextFunction

    await requireWorkspace(req, makeRes(), next)

    expect(req.workspaceId).toBe('ws-1')
    expect(next).toHaveBeenCalledOnce()
  })

  it('returns 403 NO_WORKSPACE when no workspace is found', async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue(null)
    const req = makeReq()
    const res = makeRes()
    const next = vi.fn() as NextFunction

    await requireWorkspace(req, res, next)

    expect(res.status as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(403)
    expect(res.json as ReturnType<typeof vi.fn>).toHaveBeenCalledWith({
      error: 'No workspace found',
      code: 'NO_WORKSPACE',
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('queries using the userId from the request', async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
      id: 'ws-2',
    } as never)
    const req = makeReq('specific-user')
    await requireWorkspace(req, makeRes(), vi.fn() as NextFunction)

    expect(prisma.workspace.findUnique).toHaveBeenCalledWith({
      where: { userId: 'specific-user' },
      select: { id: true },
    })
  })
})
