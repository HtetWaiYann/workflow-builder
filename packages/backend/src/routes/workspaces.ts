import { Router } from 'express'
import type { Response } from 'express'
import { randomBytes } from 'crypto'
import {
  CreateWorkspaceRequestSchema,
  InviteMemberRequestSchema,
  UpdateMemberRoleRequestSchema,
  UpdateWorkspaceNameRequestSchema,
} from '@workflow-builder/shared'
import { prisma } from '../db/client'
import { logger } from '../lib/logger'
import { requireAuth } from '../middleware/auth'
import type { AuthRequest } from '../middleware/auth'
import { requireWorkspace } from '../middleware/workspace'
import { requireRole } from '../middleware/role'
import { sendInviteEmail } from '../services/email'

export const workspacesRouter = Router()

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

const formatWorkspace = (ws: {
  id: string
  name: string
  createdAt: Date
}) => ({
  id: ws.id,
  name: ws.name,
  createdAt: ws.createdAt.toISOString(),
})

const formatUser = (u: {
  id: string
  email: string
  name: string | null
  createdAt: Date
}) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  createdAt: u.createdAt.toISOString(),
})

// ── Public endpoints (no auth required) ──────────────────────────────────────

// GET /workspaces/invites/:token — Returns metadata about a pending invite.
// Public so the invitee can preview workspace name/role before logging in.
workspacesRouter.get(
  '/invites/:token',
  async (req: AuthRequest, res: Response) => {
    try {
      const invite = await prisma.workspaceInvite.findUnique({
        where: { token: req.params.token },
        include: { workspace: true, invitedBy: true },
      })

      if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
        res
          .status(404)
          .json({ error: 'Invite not found or expired', code: 'NOT_FOUND' })
        return
      }

      res.json({
        invite: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          expiresAt: invite.expiresAt.toISOString(),
          workspace: formatWorkspace(invite.workspace),
          invitedBy: formatUser(invite.invitedBy),
        },
      })
    } catch (err) {
      logger.error({ err }, 'Failed to fetch invite')
      res
        .status(500)
        .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  }
)

// ── All routes below require authentication ───────────────────────────────────

workspacesRouter.use(requireAuth)

// GET /workspaces — Lists every workspace the authenticated user is a member of,
// including their role in each.
workspacesRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: req.userId },
      include: { workspace: true },
      orderBy: { createdAt: 'asc' },
    })

    res.json({
      workspaces: memberships.map((m) => ({
        workspace: formatWorkspace(m.workspace),
        role: m.role,
      })),
    })
  } catch (err) {
    logger.error({ err }, 'Failed to list workspaces')
    res
      .status(500)
      .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// POST /workspaces — Creates a new workspace and makes the authenticated user its OWNER.
workspacesRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = CreateWorkspaceRequestSchema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({
        error: result.error.issues[0]?.message ?? 'Invalid request',
        code: 'VALIDATION_ERROR',
      })
      return
    }

    const { workspace } = await prisma.$transaction(async (tx) => {
      const newWorkspace = await tx.workspace.create({
        data: { name: result.data.name },
      })
      await tx.workspaceMember.create({
        data: {
          userId: req.userId!,
          workspaceId: newWorkspace.id,
          role: 'OWNER',
        },
      })
      return { workspace: newWorkspace }
    })

    res
      .status(201)
      .json({ workspace: formatWorkspace(workspace), role: 'OWNER' })
  } catch (err) {
    logger.error({ err }, 'Failed to create workspace')
    res
      .status(500)
      .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// ── Invite accept / reject (auth required, no workspace membership check) ────

// POST /workspaces/invites/:token/accept — Accepts a pending invite.
// The authenticated user's email must match the invite email.
workspacesRouter.post(
  '/invites/:token/accept',
  async (req: AuthRequest, res: Response) => {
    try {
      const invite = await prisma.workspaceInvite.findUnique({
        where: { token: req.params.token },
      })

      if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
        res
          .status(404)
          .json({ error: 'Invite not found or expired', code: 'NOT_FOUND' })
        return
      }

      if (invite.email !== req.userEmail) {
        res.status(403).json({
          error: 'This invite was sent to a different email address',
          code: 'EMAIL_MISMATCH',
        })
        return
      }

      const alreadyMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: invite.workspaceId,
            userId: req.userId!,
          },
        },
      })
      if (alreadyMember) {
        res.status(409).json({
          error: 'You are already a member of this workspace',
          code: 'ALREADY_MEMBER',
        })
        return
      }

      await prisma.$transaction([
        prisma.workspaceMember.create({
          data: {
            workspaceId: invite.workspaceId,
            userId: req.userId!,
            role: invite.role,
          },
        }),
        prisma.workspaceInvite.update({
          where: { id: invite.id },
          data: { acceptedAt: new Date() },
        }),
      ])

      res.json({ workspaceId: invite.workspaceId, role: invite.role })
    } catch (err) {
      logger.error({ err }, 'Failed to accept invite')
      res
        .status(500)
        .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  }
)

// POST /workspaces/invites/:token/reject — Deletes a pending invite.
// The authenticated user's email must match the invite email.
workspacesRouter.post(
  '/invites/:token/reject',
  async (req: AuthRequest, res: Response) => {
    try {
      const invite = await prisma.workspaceInvite.findUnique({
        where: { token: req.params.token },
      })

      if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
        res
          .status(404)
          .json({ error: 'Invite not found or expired', code: 'NOT_FOUND' })
        return
      }

      if (invite.email !== req.userEmail) {
        res.status(403).json({
          error: 'This invite was sent to a different email address',
          code: 'EMAIL_MISMATCH',
        })
        return
      }

      await prisma.workspaceInvite.delete({ where: { id: invite.id } })
      res.status(204).send()
    } catch (err) {
      logger.error({ err }, 'Failed to reject invite')
      res
        .status(500)
        .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  }
)

// ── Workspace management (require workspace membership) ───────────────────────

// PATCH /workspaces/:workspaceId/name — Updates the workspace display name. OWNER only.
workspacesRouter.patch(
  '/:workspaceId/name',
  requireWorkspace,
  requireRole('OWNER'),
  async (req: AuthRequest, res: Response) => {
    const result = UpdateWorkspaceNameRequestSchema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({
        error: result.error.issues[0]?.message ?? 'Invalid request',
        code: 'VALIDATION_ERROR',
      })
      return
    }
    try {
      const updated = await prisma.workspace.update({
        where: { id: req.workspaceId },
        data: { name: result.data.name },
      })
      res.json({ workspace: formatWorkspace(updated) })
    } catch (err) {
      logger.error({ err }, 'Failed to update workspace name')
      res
        .status(500)
        .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  }
)

// ── Member management (require workspace membership) ─────────────────────────

// GET /workspaces/:workspaceId/members — Lists all members of a workspace.
// Accessible by any member (VIEWER, EDITOR, OWNER).
workspacesRouter.get(
  '/:workspaceId/members',
  requireWorkspace,
  async (req: AuthRequest, res: Response) => {
    try {
      const members = await prisma.workspaceMember.findMany({
        where: { workspaceId: req.workspaceId },
        include: { user: true },
        orderBy: { createdAt: 'asc' },
      })

      res.json({
        members: members.map((m) => ({
          id: m.id,
          workspaceId: m.workspaceId,
          userId: m.userId,
          role: m.role,
          createdAt: m.createdAt.toISOString(),
          user: formatUser(m.user),
        })),
      })
    } catch (err) {
      logger.error({ err }, 'Failed to list workspace members')
      res
        .status(500)
        .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  }
)

// GET /workspaces/:workspaceId/invites — Lists all pending (not accepted, not expired)
// invites. Token is intentionally omitted. OWNER only.
workspacesRouter.get(
  '/:workspaceId/invites',
  requireWorkspace,
  requireRole('OWNER'),
  async (req: AuthRequest, res: Response) => {
    try {
      const invites = await prisma.workspaceInvite.findMany({
        where: {
          workspaceId: req.workspaceId,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
        include: { invitedBy: true },
        orderBy: { createdAt: 'desc' },
      })

      res.json({
        invites: invites.map((i) => ({
          id: i.id,
          workspaceId: i.workspaceId,
          email: i.email,
          role: i.role,
          expiresAt: i.expiresAt.toISOString(),
          createdAt: i.createdAt.toISOString(),
          invitedBy: formatUser(i.invitedBy),
        })),
      })
    } catch (err) {
      logger.error({ err }, 'Failed to list invites')
      res
        .status(500)
        .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  }
)

// POST /workspaces/:workspaceId/invites — Creates a 7-day invite for the given email,
// sends an invite email via EmailJS, and returns the invite summary. OWNER only.
// Re-inviting the same email deletes the existing pending invite and creates a fresh one.
workspacesRouter.post(
  '/:workspaceId/invites',
  requireWorkspace,
  requireRole('OWNER'),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = InviteMemberRequestSchema.safeParse(req.body)
      if (!result.success) {
        res.status(400).json({
          error: result.error.issues[0]?.message ?? 'Invalid request',
          code: 'VALIDATION_ERROR',
        })
        return
      }

      const { email, role } = result.data

      const alreadyMember = await prisma.workspaceMember.findFirst({
        where: { workspaceId: req.workspaceId, user: { email } },
      })
      if (alreadyMember) {
        res.status(409).json({
          error: 'User is already a member of this workspace',
          code: 'ALREADY_MEMBER',
        })
        return
      }

      const pendingInvite = await prisma.workspaceInvite.findFirst({
        where: {
          workspaceId: req.workspaceId,
          email,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
      })
      if (pendingInvite) {
        res.status(409).json({
          error: `${email} has already been invited and their invitation is still pending. Use "Resend invite" to send a new link.`,
          code: 'ALREADY_INVITED',
        })
        return
      }

      const token = randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + INVITE_TTL_MS)

      const invite = await prisma.workspaceInvite.create({
        data: {
          workspaceId: req.workspaceId!,
          invitedById: req.userId!,
          email,
          role,
          token,
          expiresAt,
        },
        include: { workspace: true, invitedBy: true },
      })

      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'
      sendInviteEmail({
        email: email,
        to_email: invite.email,
        workspace_name: invite.workspace.name,
        invited_by: invite.invitedBy.name ?? invite.invitedBy.email,
        role: invite.role,
        invite_link: `${frontendUrl}/invites/${invite.token}`,
      }).catch((err) => logger.error({ err }, 'Failed to send invite email'))

      res.status(201).json({
        invite: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          expiresAt: invite.expiresAt.toISOString(),
          createdAt: invite.createdAt.toISOString(),
        },
      })
    } catch (err) {
      logger.error({ err }, 'Failed to create invite')
      res
        .status(500)
        .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  }
)

// DELETE /workspaces/:workspaceId/invites/:inviteId — Revokes a pending invite. OWNER only.
workspacesRouter.delete(
  '/:workspaceId/invites/:inviteId',
  requireWorkspace,
  requireRole('OWNER'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { inviteId } = req.params
      const invite = await prisma.workspaceInvite.findFirst({
        where: { id: inviteId, workspaceId: req.workspaceId, acceptedAt: null },
      })
      if (!invite) {
        res.status(404).json({ error: 'Invite not found', code: 'NOT_FOUND' })
        return
      }
      await prisma.workspaceInvite.delete({ where: { id: inviteId } })
      res.status(204).send()
    } catch (err) {
      logger.error({ err }, 'Failed to revoke invite')
      res
        .status(500)
        .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  }
)

// POST /workspaces/:workspaceId/invites/:inviteId/resend — Replaces a pending invite
// with a fresh token and TTL, then resends the invite email. OWNER only.
workspacesRouter.post(
  '/:workspaceId/invites/:inviteId/resend',
  requireWorkspace,
  requireRole('OWNER'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { inviteId } = req.params

      const existing = await prisma.workspaceInvite.findFirst({
        where: { id: inviteId, workspaceId: req.workspaceId, acceptedAt: null },
        include: { workspace: true, invitedBy: true },
      })
      if (!existing) {
        res.status(404).json({ error: 'Invite not found', code: 'NOT_FOUND' })
        return
      }

      const token = randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + INVITE_TTL_MS)

      await prisma.workspaceInvite.delete({ where: { id: inviteId } })

      const invite = await prisma.workspaceInvite.create({
        data: {
          workspaceId: existing.workspaceId,
          invitedById: req.userId!,
          email: existing.email,
          role: existing.role,
          token,
          expiresAt,
        },
        include: { workspace: true, invitedBy: true },
      })

      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'
      sendInviteEmail({
        email: invite.email,
        to_email: invite.email,
        workspace_name: invite.workspace.name,
        invited_by: invite.invitedBy.name ?? invite.invitedBy.email,
        role: invite.role,
        invite_link: `${frontendUrl}/invites/${invite.token}`,
      }).catch((err) => logger.error({ err }, 'Failed to resend invite email'))

      res.json({
        invite: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          expiresAt: invite.expiresAt.toISOString(),
          createdAt: invite.createdAt.toISOString(),
          invitedBy: formatUser(invite.invitedBy),
        },
      })
    } catch (err) {
      logger.error({ err }, 'Failed to resend invite')
      res
        .status(500)
        .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  }
)

// PATCH /workspaces/:workspaceId/members/:userId/role — Updates a member's role.
// OWNER only. Cannot demote the last owner.
workspacesRouter.patch(
  '/:workspaceId/members/:userId/role',
  requireWorkspace,
  requireRole('OWNER'),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = UpdateMemberRoleRequestSchema.safeParse(req.body)
      if (!result.success) {
        res.status(400).json({
          error: result.error.issues[0]?.message ?? 'Invalid request',
          code: 'VALIDATION_ERROR',
        })
        return
      }

      const { userId } = req.params
      const { role } = result.data

      const target = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId: req.workspaceId!, userId },
        },
      })
      if (!target) {
        res.status(404).json({ error: 'Member not found', code: 'NOT_FOUND' })
        return
      }

      if (target.role === 'OWNER' && role !== 'OWNER') {
        const ownerCount = await prisma.workspaceMember.count({
          where: { workspaceId: req.workspaceId, role: 'OWNER' },
        })
        if (ownerCount <= 1) {
          res.status(409).json({
            error: 'Cannot demote the last owner of a workspace',
            code: 'LAST_OWNER',
          })
          return
        }
      }

      const updated = await prisma.workspaceMember.update({
        where: {
          workspaceId_userId: { workspaceId: req.workspaceId!, userId },
        },
        data: { role },
        include: { user: true },
      })

      res.json({
        member: {
          id: updated.id,
          workspaceId: updated.workspaceId,
          userId: updated.userId,
          role: updated.role,
          createdAt: updated.createdAt.toISOString(),
          user: formatUser(updated.user),
        },
      })
    } catch (err) {
      logger.error({ err }, 'Failed to update member role')
      res
        .status(500)
        .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  }
)

// DELETE /workspaces/:workspaceId/members/:userId — Removes a member. OWNER only.
// Cannot remove the last owner.
workspacesRouter.delete(
  '/:workspaceId/members/:userId',
  requireWorkspace,
  requireRole('OWNER'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.params

      const target = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId: req.workspaceId!, userId },
        },
      })
      if (!target) {
        res.status(404).json({ error: 'Member not found', code: 'NOT_FOUND' })
        return
      }

      if (target.role === 'OWNER') {
        const ownerCount = await prisma.workspaceMember.count({
          where: { workspaceId: req.workspaceId, role: 'OWNER' },
        })
        if (ownerCount <= 1) {
          res.status(409).json({
            error: 'Cannot remove the last owner of a workspace',
            code: 'LAST_OWNER',
          })
          return
        }
      }

      await prisma.workspaceMember.delete({
        where: {
          workspaceId_userId: { workspaceId: req.workspaceId!, userId },
        },
      })

      res.status(204).send()
    } catch (err) {
      logger.error({ err }, 'Failed to remove member')
      res
        .status(500)
        .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  }
)
