import { Router } from 'express'
import type { Response } from 'express'
import {
  WorkflowNodeSchema,
  WorkflowEdgeSchema,
  CreateWorkflowRequestSchema,
  RenameWorkflowRequestSchema,
  SaveWorkflowRequestSchema,
} from '@workflow-builder/shared'
import type { Workflow, WorkflowSummary } from '@workflow-builder/shared'
import { z } from 'zod'
import type { Prisma } from '../generated/prisma/client'
import { prisma } from '../db/client'
import { logger } from '../lib/logger'
import { requireAuth } from '../middleware/auth'
import type { AuthRequest } from '../middleware/auth'
import { requireWorkspace } from '../middleware/workspace'
import { requireRole } from '../middleware/role'
import executionSubRouter from './executions'
import { webhookSecretsRouter } from './webhookSecrets'
import {
  scheduleCronWorkflow,
  removeCronWorkflow,
} from '../services/cronScheduler'

const router = Router()

router.use(requireAuth, requireWorkspace)

// ── Format helpers ────────────────────────────────────────────────────────────

type WorkflowStatusLiteral = 'DRAFT' | 'ACTIVE' | 'INACTIVE'

type PrismaWorkflowBase = {
  id: string
  workspaceId: string
  name: string
  status: WorkflowStatusLiteral
  createdAt: Date
  updatedAt: Date
}

type PrismaWorkflowSummaryRow = PrismaWorkflowBase & {
  _count?: { executions: number }
}

type PrismaWorkflow = PrismaWorkflowBase & { nodes: unknown; edges: unknown }

const toInputJson = (v: unknown): Prisma.InputJsonValue =>
  v as unknown as Prisma.InputJsonValue

const parseNodes = (raw: unknown) =>
  z.array(WorkflowNodeSchema).catch([]).parse(raw)
const parseEdges = (raw: unknown) =>
  z.array(WorkflowEdgeSchema).catch([]).parse(raw)

const formatWorkflow = (w: PrismaWorkflow): Workflow => ({
  id: w.id,
  workspaceId: w.workspaceId,
  name: w.name,
  status: w.status,
  nodes: parseNodes(w.nodes),
  edges: parseEdges(w.edges),
  createdAt: w.createdAt.toISOString(),
  updatedAt: w.updatedAt.toISOString(),
})

const formatWorkflowSummary = (
  w: PrismaWorkflowSummaryRow
): WorkflowSummary => ({
  id: w.id,
  workspaceId: w.workspaceId,
  name: w.name,
  status: w.status,
  runCount: w._count?.executions ?? 0,
  createdAt: w.createdAt.toISOString(),
  updatedAt: w.updatedAt.toISOString(),
})

// ── Ownership helper ──────────────────────────────────────────────────────────

type WorkflowRow = Awaited<ReturnType<typeof prisma.workflow.findUnique>> &
  object

type GetWorkflowResult =
  | { status: 'ok'; workflow: WorkflowRow }
  | { status: 'not_found' }
  | { status: 'forbidden' }

/**
 * Looks up a workflow by id, then verifies it belongs to the given workspace.
 * Returns a discriminated result so callers can send the appropriate HTTP response:
 * - `not_found` → 404 (workflow doesn't exist)
 * - `forbidden` → 403 `WORKFLOW_FORBIDDEN` (exists but belongs to another workspace)
 * - `ok` → proceed with `workflow`
 */
async function getOwnedWorkflow(
  workflowId: string,
  workspaceId: string
): Promise<GetWorkflowResult> {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
  })
  if (!workflow) return { status: 'not_found' }
  if (workflow.workspaceId !== workspaceId) return { status: 'forbidden' }
  return { status: 'ok', workflow }
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /workflows — Lists all workflows belonging to the caller's workspace, ordered by most
// recently updated. Returns summary objects without nodes or edges.
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const workflows = await prisma.workflow.findMany({
      where: { workspaceId: req.workspaceId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        workspaceId: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { executions: true } },
      },
    })
    res.json({ workflows: workflows.map(formatWorkflowSummary) })
  } catch (err) {
    logger.error({ err }, 'GET /workflows failed')
    res
      .status(500)
      .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// POST /workflows — Creates a new DRAFT workflow with empty nodes and edges. EDITOR or OWNER only.
router.post(
  '/',
  requireRole('EDITOR', 'OWNER'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = CreateWorkflowRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message ?? 'Invalid request',
        code: 'VALIDATION_ERROR',
      })
      return
    }

    try {
      const workflow = await prisma.workflow.create({
        data: {
          workspaceId: req.workspaceId!,
          name: parsed.data.name,
          status: 'DRAFT',
          nodes: [],
          edges: [],
        },
      })
      res.status(201).json({ workflow: formatWorkflow(workflow) })
    } catch (err) {
      logger.error({ err }, 'POST /workflows failed')
      res
        .status(500)
        .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  }
)

// GET /workflows/:workflowId — Fetches a single workflow by id, including the full nodes and
// edges arrays. Returns 404 if the workflow does not exist, 403 if it belongs to a different workspace.
router.get(
  '/:workflowId',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await getOwnedWorkflow(
        req.params.workflowId,
        req.workspaceId!
      )
      if (result.status === 'not_found') {
        res.status(404).json({ error: 'Workflow not found', code: 'NOT_FOUND' })
        return
      }
      if (result.status === 'forbidden') {
        res.status(403).json({
          error: 'You do not have access to this workflow',
          code: 'WORKFLOW_FORBIDDEN',
        })
        return
      }
      res.json({ workflow: formatWorkflow(result.workflow) })
    } catch (err) {
      logger.error({ err }, 'GET /workflows/:id failed')
      res
        .status(500)
        .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  }
)

// PATCH /workflows/:workflowId — Renames the workflow using the RenameWorkflowRequest schema.
// Returns a workflow summary (no nodes/edges) with the updated name. EDITOR or OWNER only.
router.patch(
  '/:workflowId',
  requireRole('EDITOR', 'OWNER'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = RenameWorkflowRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message ?? 'Invalid request',
        code: 'VALIDATION_ERROR',
      })
      return
    }

    try {
      const result = await getOwnedWorkflow(
        req.params.workflowId,
        req.workspaceId!
      )
      if (result.status === 'not_found') {
        res.status(404).json({ error: 'Workflow not found', code: 'NOT_FOUND' })
        return
      }
      if (result.status === 'forbidden') {
        res.status(403).json({
          error: 'You do not have access to this workflow',
          code: 'WORKFLOW_FORBIDDEN',
        })
        return
      }

      const updated = await prisma.workflow.update({
        where: { id: req.params.workflowId },
        data: { name: parsed.data.name },
      })
      res.json({ workflow: formatWorkflowSummary(updated) })
    } catch (err) {
      logger.error({ err }, 'PATCH /workflows/:id failed')
      res
        .status(500)
        .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  }
)

// PUT /workflows/:workflowId/graph — Saves the canvas by replacing the workflow's nodes and
// edges in one atomic update. Returns the full workflow with the new graph. EDITOR or OWNER only.
router.put(
  '/:workflowId/graph',
  requireRole('EDITOR', 'OWNER'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = SaveWorkflowRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message ?? 'Invalid request',
        code: 'VALIDATION_ERROR',
      })
      return
    }

    try {
      const result = await getOwnedWorkflow(
        req.params.workflowId,
        req.workspaceId!
      )
      if (result.status === 'not_found') {
        res.status(404).json({ error: 'Workflow not found', code: 'NOT_FOUND' })
        return
      }
      if (result.status === 'forbidden') {
        res.status(403).json({
          error: 'You do not have access to this workflow',
          code: 'WORKFLOW_FORBIDDEN',
        })
        return
      }

      const updated = await prisma.workflow.update({
        where: { id: req.params.workflowId },
        data: {
          nodes: toInputJson(parsed.data.nodes),
          edges: toInputJson(parsed.data.edges),
        },
      })
      res.json({ workflow: formatWorkflow(updated) })
    } catch (err) {
      logger.error({ err }, 'PUT /workflows/:id/graph failed')
      res
        .status(500)
        .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  }
)

// POST /workflows/:workflowId/activate — Transitions the workflow's status to ACTIVE, enabling
// it to be triggered by cron or webhook events. EDITOR or OWNER only.
router.post(
  '/:workflowId/activate',
  requireRole('EDITOR', 'OWNER'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await getOwnedWorkflow(
        req.params.workflowId,
        req.workspaceId!
      )
      if (result.status === 'not_found') {
        res.status(404).json({ error: 'Workflow not found', code: 'NOT_FOUND' })
        return
      }
      if (result.status === 'forbidden') {
        res.status(403).json({
          error: 'You do not have access to this workflow',
          code: 'WORKFLOW_FORBIDDEN',
        })
        return
      }

      const updated = await prisma.workflow.update({
        where: { id: req.params.workflowId },
        data: { status: 'ACTIVE' },
      })

      scheduleCronWorkflow(req.params.workflowId, updated.nodes).catch((err) =>
        logger.warn(
          { err, workflowId: req.params.workflowId },
          'Failed to schedule cron workflow'
        )
      )

      res.json({ workflow: formatWorkflowSummary(updated) })
    } catch (err) {
      logger.error({ err }, 'POST /workflows/:id/activate failed')
      res
        .status(500)
        .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  }
)

// POST /workflows/:workflowId/deactivate — Transitions the workflow's status to INACTIVE,
// stopping it from accepting new trigger events. EDITOR or OWNER only.
router.post(
  '/:workflowId/deactivate',
  requireRole('EDITOR', 'OWNER'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await getOwnedWorkflow(
        req.params.workflowId,
        req.workspaceId!
      )
      if (result.status === 'not_found') {
        res.status(404).json({ error: 'Workflow not found', code: 'NOT_FOUND' })
        return
      }
      if (result.status === 'forbidden') {
        res.status(403).json({
          error: 'You do not have access to this workflow',
          code: 'WORKFLOW_FORBIDDEN',
        })
        return
      }

      const updated = await prisma.workflow.update({
        where: { id: req.params.workflowId },
        data: { status: 'INACTIVE' },
      })

      removeCronWorkflow(req.params.workflowId).catch((err) =>
        logger.warn(
          { err, workflowId: req.params.workflowId },
          'Failed to remove cron workflow'
        )
      )

      res.json({ workflow: formatWorkflowSummary(updated) })
    } catch (err) {
      logger.error({ err }, 'POST /workflows/:id/deactivate failed')
      res
        .status(500)
        .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  }
)

// POST /workflows/:workflowId/duplicate — Creates a DRAFT copy of the source workflow with
// the same nodes and edges, appending "(copy)" to the name. EDITOR or OWNER only.
router.post(
  '/:workflowId/duplicate',
  requireRole('EDITOR', 'OWNER'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await getOwnedWorkflow(
        req.params.workflowId,
        req.workspaceId!
      )
      if (result.status === 'not_found') {
        res.status(404).json({ error: 'Workflow not found', code: 'NOT_FOUND' })
        return
      }
      if (result.status === 'forbidden') {
        res.status(403).json({
          error: 'You do not have access to this workflow',
          code: 'WORKFLOW_FORBIDDEN',
        })
        return
      }

      const copy = await prisma.workflow.create({
        data: {
          workspaceId: req.workspaceId!,
          name: `${result.workflow.name} (copy)`,
          status: 'DRAFT',
          nodes: toInputJson(result.workflow.nodes ?? []),
          edges: toInputJson(result.workflow.edges ?? []),
        },
      })
      res.status(201).json({ workflow: formatWorkflow(copy) })
    } catch (err) {
      logger.error({ err }, 'POST /workflows/:id/duplicate failed')
      res
        .status(500)
        .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  }
)

// PATCH /workflows/:workflowId/name — Updates only the workflow's display name. Returns a
// lean { data: { id, name } } payload used by the canvas toolbar for optimistic updates. EDITOR or OWNER only.
router.patch(
  '/:workflowId/name',
  requireRole('EDITOR', 'OWNER'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = z
      .object({ name: z.string().min(1).max(255) })
      .safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message ?? 'Invalid request',
        code: 'VALIDATION_ERROR',
      })
      return
    }

    try {
      const result = await getOwnedWorkflow(
        req.params.workflowId,
        req.workspaceId!
      )
      if (result.status === 'not_found') {
        res.status(404).json({ error: 'Workflow not found', code: 'NOT_FOUND' })
        return
      }
      if (result.status === 'forbidden') {
        res.status(403).json({
          error: 'You do not have access to this workflow',
          code: 'WORKFLOW_FORBIDDEN',
        })
        return
      }

      const updated = await prisma.workflow.update({
        where: { id: req.params.workflowId },
        data: { name: parsed.data.name },
      })
      res.json({ data: { id: updated.id, name: updated.name } })
    } catch (err) {
      logger.error({ err }, 'PATCH /workflows/:id/name failed')
      res
        .status(500)
        .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  }
)

// DELETE /workflows/:workflowId — Permanently removes the workflow and all associated data.
// Responds with 204 No Content on success. OWNER only.
router.delete(
  '/:workflowId',
  requireRole('OWNER'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await getOwnedWorkflow(
        req.params.workflowId,
        req.workspaceId!
      )
      if (result.status === 'not_found') {
        res.status(404).json({ error: 'Workflow not found', code: 'NOT_FOUND' })
        return
      }
      if (result.status === 'forbidden') {
        res.status(403).json({
          error: 'You do not have access to this workflow',
          code: 'WORKFLOW_FORBIDDEN',
        })
        return
      }

      await prisma.workflow.delete({ where: { id: req.params.workflowId } })
      res.status(204).send()
    } catch (err) {
      logger.error({ err }, 'DELETE /workflows/:id failed')
      res
        .status(500)
        .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  }
)

// Mount execution sub-routes under /:workflowId/executions
router.use('/:workflowId/executions', executionSubRouter)

// Mount webhook HMAC secret management under /:workflowId/nodes/:nodeId/webhook-secret
router.use('/:workflowId/nodes/:nodeId/webhook-secret', webhookSecretsRouter)

export default router
