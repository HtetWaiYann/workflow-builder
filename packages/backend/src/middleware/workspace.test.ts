import { vi, describe, it, expect } from 'vitest'

vi.mock('../db/client', () => ({
  prisma: {
    workspaceMember: {
      findUnique: vi.fn(),
    },
  },
}))

import type { Response, NextFunction } from 'express'
import { requireWorkspace } from './workspace'
import { prisma } from '../db/client'
import type { AuthRequest } from './auth'

function makeReq(userId = 'user-1', workspaceId = 'ws-1'): AuthRequest {
  return {
    userId,
    headers: { 'x-workspace-id': workspaceId },
  } as unknown as AuthRequest
}

function makeRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }
  return res as unknown as Response
}

// Looks up workspace membership for the authenticated user via the X-Workspace-ID header
// and attaches workspaceId + memberRole to the request.
// Returns 400 when the header is absent, 403 when no membership is found.
describe('requireWorkspace', () => {
  it('attaches workspaceId and memberRole and calls next when membership exists', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
      role: 'OWNER',
    } as never)
    const req = makeReq()
    const next = vi.fn() as NextFunction

    await requireWorkspace(req, makeRes(), next)

    expect(req.workspaceId).toBe('ws-1')
    expect(req.memberRole).toBe('OWNER')
    expect(next).toHaveBeenCalledOnce()
  })

  it('returns 403 FORBIDDEN when no membership is found', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(null)
    const req = makeReq()
    const res = makeRes()
    const next = vi.fn() as NextFunction

    await requireWorkspace(req, res, next)

    expect(res.status as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(403)
    expect(res.json as ReturnType<typeof vi.fn>).toHaveBeenCalledWith({
      error: 'No access to this workspace',
      code: 'FORBIDDEN',
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 400 MISSING_WORKSPACE when the X-Workspace-ID header is absent', async () => {
    const req = { userId: 'user-1', headers: {} } as unknown as AuthRequest
    const res = makeRes()
    const next = vi.fn() as NextFunction

    await requireWorkspace(req, res, next)

    expect(res.status as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(400)
    expect(res.json as ReturnType<typeof vi.fn>).toHaveBeenCalledWith({
      error: 'X-Workspace-ID header is required',
      code: 'MISSING_WORKSPACE',
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('queries using the workspaceId header and userId from the request', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
      role: 'EDITOR',
    } as never)
    const req = makeReq('specific-user', 'ws-42')
    await requireWorkspace(req, makeRes(), vi.fn() as NextFunction)

    expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
      where: {
        workspaceId_userId: { workspaceId: 'ws-42', userId: 'specific-user' },
      },
      select: { role: true },
    })
  })
})
