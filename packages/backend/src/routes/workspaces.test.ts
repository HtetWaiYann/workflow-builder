import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../middleware/auth', () => ({
  requireAuth: (
    req: Record<string, unknown>,
    _res: unknown,
    next: () => void
  ) => {
    req['userId'] = 'test-user-id'
    req['userEmail'] = 'test@example.com'
    next()
  },
}))

vi.mock('../middleware/workspace', () => ({
  requireWorkspace: (
    req: Record<string, unknown>,
    _res: unknown,
    next: () => void
  ) => {
    req['workspaceId'] = 'test-workspace-id'
    req['memberRole'] = 'OWNER'
    next()
  },
}))

vi.mock('../db/client', () => ({
  prisma: {
    workspaceMember: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    workspace: {
      create: vi.fn(),
      update: vi.fn(),
    },
    workspaceInvite: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('../services/email', () => ({
  sendInviteEmail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import express from 'express'
import request from 'supertest'
import { workspacesRouter } from './workspaces'
import { prisma } from '../db/client'

const app = express()
app.use(express.json())
app.use('/workspaces', workspacesRouter)

const NOW = new Date('2024-01-15T10:00:00.000Z')

const fakeUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: NOW,
}

const fakeWorkspace = {
  id: 'test-workspace-id',
  name: 'My Workspace',
  createdAt: NOW,
}

const fakeMember = {
  id: 'member-1',
  workspaceId: 'test-workspace-id',
  userId: 'test-user-id',
  role: 'OWNER',
  createdAt: NOW,
  user: fakeUser,
}

const fakeInvite = {
  id: 'invite-1',
  workspaceId: 'test-workspace-id',
  invitedById: 'test-user-id',
  email: 'invitee@example.com',
  role: 'EDITOR',
  token: 'abc123token',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  acceptedAt: null,
  createdAt: NOW,
  workspace: fakeWorkspace,
  invitedBy: fakeUser,
}

// Returns metadata about a pending invite so the invitee can preview it before logging in.
// Public endpoint — no authentication required.
describe('GET /workspaces/invites/:token', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with invite details for a valid, non-expired token', async () => {
    vi.mocked(prisma.workspaceInvite.findUnique).mockResolvedValue(
      fakeInvite as never
    )

    const res = await request(app).get('/workspaces/invites/abc123token')

    expect(res.status).toBe(200)
    expect(res.body.invite.email).toBe('invitee@example.com')
    expect(res.body.invite.role).toBe('EDITOR')
    expect(res.body.invite.workspace.id).toBe('test-workspace-id')
    expect(res.body.invite.invitedBy.id).toBe('test-user-id')
  })

  it('returns 404 when the invite token does not exist', async () => {
    vi.mocked(prisma.workspaceInvite.findUnique).mockResolvedValue(null)

    const res = await request(app).get('/workspaces/invites/nonexistent')

    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })

  it('returns 404 when the invite has already been accepted', async () => {
    vi.mocked(prisma.workspaceInvite.findUnique).mockResolvedValue({
      ...fakeInvite,
      acceptedAt: new Date(),
    } as never)

    const res = await request(app).get('/workspaces/invites/abc123token')

    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })

  it('returns 404 when the invite has expired', async () => {
    vi.mocked(prisma.workspaceInvite.findUnique).mockResolvedValue({
      ...fakeInvite,
      expiresAt: new Date('2020-01-01'),
    } as never)

    const res = await request(app).get('/workspaces/invites/abc123token')

    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })
})

// Lists every workspace the authenticated user is a member of, including their role.
describe('GET /workspaces', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with workspace memberships', async () => {
    vi.mocked(prisma.workspaceMember.findMany).mockResolvedValue([
      { workspace: fakeWorkspace, role: 'OWNER', createdAt: NOW },
    ] as never)

    const res = await request(app).get('/workspaces')

    expect(res.status).toBe(200)
    expect(res.body.workspaces).toHaveLength(1)
    expect(res.body.workspaces[0].workspace.id).toBe('test-workspace-id')
    expect(res.body.workspaces[0].role).toBe('OWNER')
  })

  it('returns 200 with an empty list when user has no memberships', async () => {
    vi.mocked(prisma.workspaceMember.findMany).mockResolvedValue([])

    const res = await request(app).get('/workspaces')

    expect(res.status).toBe(200)
    expect(res.body.workspaces).toEqual([])
  })

  it('returns 500 on database error', async () => {
    vi.mocked(prisma.workspaceMember.findMany).mockRejectedValue(
      new Error('db down')
    )

    const res = await request(app).get('/workspaces')

    expect(res.status).toBe(500)
    expect(res.body.code).toBe('INTERNAL_ERROR')
  })
})

// Creates a new workspace and makes the authenticated user its OWNER.
describe('POST /workspaces', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a workspace and returns 201 with role OWNER', async () => {
    vi.mocked(
      prisma.$transaction as unknown as (fn: unknown) => Promise<unknown>
    ).mockImplementation(async (fn) => {
      if (typeof fn === 'function') {
        const tx = {
          workspace: { create: vi.fn().mockResolvedValue(fakeWorkspace) },
          workspaceMember: { create: vi.fn().mockResolvedValue(fakeMember) },
        }
        return (fn as (tx: unknown) => Promise<unknown>)(tx)
      }
      return []
    })

    const res = await request(app)
      .post('/workspaces')
      .send({ name: 'My Workspace' })

    expect(res.status).toBe(201)
    expect(res.body.workspace.id).toBe('test-workspace-id')
    expect(res.body.role).toBe('OWNER')
  })

  it('returns 400 when name is missing', async () => {
    const res = await request(app).post('/workspaces').send({})

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 when name is an empty string', async () => {
    const res = await request(app).post('/workspaces').send({ name: '' })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })
})

// Accepts a pending invite. The authenticated user's email must match the invite email.
describe('POST /workspaces/invites/:token/accept', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a membership and returns the workspaceId and role', async () => {
    vi.mocked(prisma.workspaceInvite.findUnique).mockResolvedValue({
      ...fakeInvite,
      email: 'test@example.com', // matches req.userEmail set by auth mock
    } as never)
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.workspaceMember.create).mockResolvedValue(
      fakeMember as never
    )
    vi.mocked(prisma.workspaceInvite.update).mockResolvedValue(
      fakeInvite as never
    )
    vi.mocked(
      prisma.$transaction as unknown as (arr: unknown) => Promise<unknown>
    ).mockResolvedValue([fakeMember, fakeInvite])

    const res = await request(app)
      .post('/workspaces/invites/abc123token/accept')
      .set('Cookie', 'token=valid-token')

    expect(res.status).toBe(200)
    expect(res.body.workspaceId).toBe('test-workspace-id')
    expect(res.body.role).toBe('EDITOR')
  })

  it('returns 404 when the invite does not exist', async () => {
    vi.mocked(prisma.workspaceInvite.findUnique).mockResolvedValue(null)

    const res = await request(app).post(
      '/workspaces/invites/nonexistent/accept'
    )

    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })

  it('returns 403 when the authenticated email does not match the invite email', async () => {
    vi.mocked(prisma.workspaceInvite.findUnique).mockResolvedValue({
      ...fakeInvite,
      email: 'other@example.com',
    } as never)

    const res = await request(app).post(
      '/workspaces/invites/abc123token/accept'
    )

    expect(res.status).toBe(403)
    expect(res.body.code).toBe('EMAIL_MISMATCH')
  })

  it('returns 409 when the user is already a member of the workspace', async () => {
    vi.mocked(prisma.workspaceInvite.findUnique).mockResolvedValue({
      ...fakeInvite,
      email: 'test@example.com', // matches req.userEmail set by auth mock
    } as never)
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(
      fakeMember as never
    )

    const res = await request(app).post(
      '/workspaces/invites/abc123token/accept'
    )

    expect(res.status).toBe(409)
    expect(res.body.code).toBe('ALREADY_MEMBER')
  })
})

// Deletes a pending invite. The authenticated user's email must match the invite email.
describe('POST /workspaces/invites/:token/reject', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes the invite and returns 204', async () => {
    vi.mocked(prisma.workspaceInvite.findUnique).mockResolvedValue({
      ...fakeInvite,
      email: 'test@example.com', // matches req.userEmail set by auth mock
    } as never)
    vi.mocked(prisma.workspaceInvite.delete).mockResolvedValue(
      fakeInvite as never
    )

    const res = await request(app).post(
      '/workspaces/invites/abc123token/reject'
    )

    expect(res.status).toBe(204)
    expect(res.text).toBe('')
  })

  it('returns 404 when the invite does not exist', async () => {
    vi.mocked(prisma.workspaceInvite.findUnique).mockResolvedValue(null)

    const res = await request(app).post(
      '/workspaces/invites/nonexistent/reject'
    )

    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })

  it('returns 403 when the authenticated email does not match the invite email', async () => {
    vi.mocked(prisma.workspaceInvite.findUnique).mockResolvedValue({
      ...fakeInvite,
      email: 'other@example.com',
    } as never)

    const res = await request(app).post(
      '/workspaces/invites/abc123token/reject'
    )

    expect(res.status).toBe(403)
    expect(res.body.code).toBe('EMAIL_MISMATCH')
  })
})

// Updates the workspace display name. OWNER only.
describe('PATCH /workspaces/:workspaceId/name', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates the workspace name and returns 200', async () => {
    vi.mocked(prisma.workspace.update).mockResolvedValue({
      ...fakeWorkspace,
      name: 'Renamed Workspace',
    } as never)

    const res = await request(app)
      .patch('/workspaces/test-workspace-id/name')
      .send({ name: 'Renamed Workspace' })

    expect(res.status).toBe(200)
    expect(res.body.workspace.name).toBe('Renamed Workspace')
  })

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .patch('/workspaces/test-workspace-id/name')
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 500 on database error', async () => {
    vi.mocked(prisma.workspace.update).mockRejectedValue(new Error('db down'))

    const res = await request(app)
      .patch('/workspaces/test-workspace-id/name')
      .send({ name: 'New Name' })

    expect(res.status).toBe(500)
    expect(res.body.code).toBe('INTERNAL_ERROR')
  })
})

// Lists all members of a workspace. Accessible by any member.
describe('GET /workspaces/:workspaceId/members', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with the list of members', async () => {
    vi.mocked(prisma.workspaceMember.findMany).mockResolvedValue([
      fakeMember,
    ] as never)

    const res = await request(app).get('/workspaces/test-workspace-id/members')

    expect(res.status).toBe(200)
    expect(res.body.members).toHaveLength(1)
    expect(res.body.members[0].userId).toBe('test-user-id')
    expect(res.body.members[0].role).toBe('OWNER')
    expect(res.body.members[0].user.email).toBe('test@example.com')
  })

  it('returns 200 with an empty list when no members exist', async () => {
    vi.mocked(prisma.workspaceMember.findMany).mockResolvedValue([])

    const res = await request(app).get('/workspaces/test-workspace-id/members')

    expect(res.status).toBe(200)
    expect(res.body.members).toEqual([])
  })
})

// Lists all pending (not accepted, not expired) invites. OWNER only.
describe('GET /workspaces/:workspaceId/invites', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with pending invites (token omitted)', async () => {
    vi.mocked(prisma.workspaceInvite.findMany).mockResolvedValue([
      { ...fakeInvite, invitedBy: fakeUser },
    ] as never)

    const res = await request(app).get('/workspaces/test-workspace-id/invites')

    expect(res.status).toBe(200)
    expect(res.body.invites).toHaveLength(1)
    expect(res.body.invites[0].email).toBe('invitee@example.com')
    expect(res.body.invites[0]).not.toHaveProperty('token')
  })

  it('returns 200 with an empty list when there are no pending invites', async () => {
    vi.mocked(prisma.workspaceInvite.findMany).mockResolvedValue([])

    const res = await request(app).get('/workspaces/test-workspace-id/invites')

    expect(res.status).toBe(200)
    expect(res.body.invites).toEqual([])
  })
})

// Creates a 7-day invite for the given email address. OWNER only.
describe('POST /workspaces/:workspaceId/invites', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates an invite and returns 201', async () => {
    vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.workspaceInvite.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.workspaceInvite.create).mockResolvedValue(
      fakeInvite as never
    )

    const res = await request(app)
      .post('/workspaces/test-workspace-id/invites')
      .send({ email: 'invitee@example.com', role: 'EDITOR' })

    expect(res.status).toBe(201)
    expect(res.body.invite.email).toBe('invitee@example.com')
    expect(res.body.invite.role).toBe('EDITOR')
    expect(res.body.invite).not.toHaveProperty('token')
  })

  it('returns 400 when email is invalid', async () => {
    const res = await request(app)
      .post('/workspaces/test-workspace-id/invites')
      .send({ email: 'not-an-email', role: 'EDITOR' })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 when role is invalid', async () => {
    const res = await request(app)
      .post('/workspaces/test-workspace-id/invites')
      .send({ email: 'invitee@example.com', role: 'SUPERUSER' })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 409 when the user is already a member', async () => {
    vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue(
      fakeMember as never
    )

    const res = await request(app)
      .post('/workspaces/test-workspace-id/invites')
      .send({ email: 'invitee@example.com', role: 'EDITOR' })

    expect(res.status).toBe(409)
    expect(res.body.code).toBe('ALREADY_MEMBER')
  })

  it('returns 409 when a pending invite already exists for the email', async () => {
    vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.workspaceInvite.findFirst).mockResolvedValue(
      fakeInvite as never
    )

    const res = await request(app)
      .post('/workspaces/test-workspace-id/invites')
      .send({ email: 'invitee@example.com', role: 'EDITOR' })

    expect(res.status).toBe(409)
    expect(res.body.code).toBe('ALREADY_INVITED')
  })
})

// Revokes a pending invite. OWNER only.
describe('DELETE /workspaces/:workspaceId/invites/:inviteId', () => {
  beforeEach(() => vi.clearAllMocks())

  it('revokes the invite and returns 204', async () => {
    vi.mocked(prisma.workspaceInvite.findFirst).mockResolvedValue(
      fakeInvite as never
    )
    vi.mocked(prisma.workspaceInvite.delete).mockResolvedValue(
      fakeInvite as never
    )

    const res = await request(app).delete(
      '/workspaces/test-workspace-id/invites/invite-1'
    )

    expect(res.status).toBe(204)
    expect(res.text).toBe('')
  })

  it('returns 404 when the invite does not exist', async () => {
    vi.mocked(prisma.workspaceInvite.findFirst).mockResolvedValue(null)

    const res = await request(app).delete(
      '/workspaces/test-workspace-id/invites/nonexistent'
    )

    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })
})

// Replaces a pending invite with a fresh token and TTL, then resends the email. OWNER only.
describe('POST /workspaces/:workspaceId/invites/:inviteId/resend', () => {
  beforeEach(() => vi.clearAllMocks())

  it('resends the invite with a new token and returns 200', async () => {
    vi.mocked(prisma.workspaceInvite.findFirst).mockResolvedValue(
      fakeInvite as never
    )
    vi.mocked(prisma.workspaceInvite.delete).mockResolvedValue(
      fakeInvite as never
    )
    vi.mocked(prisma.workspaceInvite.create).mockResolvedValue(
      fakeInvite as never
    )

    const res = await request(app).post(
      '/workspaces/test-workspace-id/invites/invite-1/resend'
    )

    expect(res.status).toBe(200)
    expect(res.body.invite.email).toBe('invitee@example.com')
  })

  it('returns 404 when the invite does not exist', async () => {
    vi.mocked(prisma.workspaceInvite.findFirst).mockResolvedValue(null)

    const res = await request(app).post(
      '/workspaces/test-workspace-id/invites/nonexistent/resend'
    )

    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })
})

// Updates a member's role. OWNER only. Cannot demote the last owner.
describe('PATCH /workspaces/:workspaceId/members/:userId/role', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates the role and returns 200 with the updated member', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
      ...fakeMember,
      role: 'EDITOR',
    } as never)
    vi.mocked(prisma.workspaceMember.update).mockResolvedValue({
      ...fakeMember,
      role: 'EDITOR',
    } as never)

    const res = await request(app)
      .patch('/workspaces/test-workspace-id/members/test-user-id/role')
      .send({ role: 'EDITOR' })

    expect(res.status).toBe(200)
    expect(res.body.member.role).toBe('EDITOR')
  })

  it('returns 400 when role is invalid', async () => {
    const res = await request(app)
      .patch('/workspaces/test-workspace-id/members/test-user-id/role')
      .send({ role: 'SUPERUSER' })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 404 when the member does not exist', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(null)

    const res = await request(app)
      .patch('/workspaces/test-workspace-id/members/nonexistent/role')
      .send({ role: 'EDITOR' })

    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })

  it('returns 409 when demoting the last owner', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
      ...fakeMember,
      role: 'OWNER',
    } as never)
    vi.mocked(prisma.workspaceMember.count).mockResolvedValue(1)

    const res = await request(app)
      .patch('/workspaces/test-workspace-id/members/test-user-id/role')
      .send({ role: 'EDITOR' })

    expect(res.status).toBe(409)
    expect(res.body.code).toBe('LAST_OWNER')
  })

  it('allows demoting an owner when other owners remain', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
      ...fakeMember,
      role: 'OWNER',
    } as never)
    vi.mocked(prisma.workspaceMember.count).mockResolvedValue(2)
    vi.mocked(prisma.workspaceMember.update).mockResolvedValue({
      ...fakeMember,
      role: 'EDITOR',
    } as never)

    const res = await request(app)
      .patch('/workspaces/test-workspace-id/members/test-user-id/role')
      .send({ role: 'EDITOR' })

    expect(res.status).toBe(200)
    expect(res.body.member.role).toBe('EDITOR')
  })
})

// Removes a member from the workspace. OWNER only. Cannot remove the last owner.
describe('DELETE /workspaces/:workspaceId/members/:userId', () => {
  beforeEach(() => vi.clearAllMocks())

  it('removes the member and returns 204', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
      ...fakeMember,
      role: 'EDITOR',
    } as never)
    vi.mocked(prisma.workspaceMember.delete).mockResolvedValue(
      fakeMember as never
    )

    const res = await request(app).delete(
      '/workspaces/test-workspace-id/members/test-user-id'
    )

    expect(res.status).toBe(204)
    expect(res.text).toBe('')
  })

  it('returns 404 when the member does not exist', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(null)

    const res = await request(app).delete(
      '/workspaces/test-workspace-id/members/nonexistent'
    )

    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })

  it('returns 409 when removing the last owner', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
      ...fakeMember,
      role: 'OWNER',
    } as never)
    vi.mocked(prisma.workspaceMember.count).mockResolvedValue(1)

    const res = await request(app).delete(
      '/workspaces/test-workspace-id/members/test-user-id'
    )

    expect(res.status).toBe(409)
    expect(res.body.code).toBe('LAST_OWNER')
  })

  it('allows removing an owner when other owners remain', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
      ...fakeMember,
      role: 'OWNER',
    } as never)
    vi.mocked(prisma.workspaceMember.count).mockResolvedValue(2)
    vi.mocked(prisma.workspaceMember.delete).mockResolvedValue(
      fakeMember as never
    )

    const res = await request(app).delete(
      '/workspaces/test-workspace-id/members/test-user-id'
    )

    expect(res.status).toBe(204)
  })
})
