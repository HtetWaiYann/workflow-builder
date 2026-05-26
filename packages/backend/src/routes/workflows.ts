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
import executionSubRouter from './executions'
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

const formatWorkflowSummary = (w: PrismaWorkflowBase): WorkflowSummary => ({
  id: w.id,
  workspaceId: w.workspaceId,
  name: w.name,
  status: w.status,
  createdAt: w.createdAt.toISOString(),
  updatedAt: w.updatedAt.toISOString(),
})

// ── Ownership helper ──────────────────────────────────────────────────────────

async function getOwnedWorkflow(workflowId: string, workspaceId: string) {
  return prisma.workflow.findFirst({ where: { id: workflowId, workspaceId } })
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

// POST /workflows — Creates a new DRAFT workflow with empty nodes and edges. Requires a
// non-empty name in the request body.
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
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
})

// GET /workflows/:workflowId — Fetches a single workflow by id, including the full nodes and
// edges arrays. Returns 404 if not found or not owned by the caller's workspace.
router.get(
  '/:workflowId',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const workflow = await getOwnedWorkflow(
        req.params.workflowId,
        req.workspaceId!
      )
      if (!workflow) {
        res.status(404).json({ error: 'Workflow not found', code: 'NOT_FOUND' })
        return
      }
      res.json({ workflow: formatWorkflow(workflow) })
    } catch (err) {
      logger.error({ err }, 'GET /workflows/:id failed')
      res
        .status(500)
        .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  }
)

// PATCH /workflows/:workflowId — Renames the workflow using the RenameWorkflowRequest schema.
// Returns a workflow summary (no nodes/edges) with the updated name.
router.patch(
  '/:workflowId',
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
      const existing = await getOwnedWorkflow(
        req.params.workflowId,
        req.workspaceId!
      )
      if (!existing) {
        res.status(404).json({ error: 'Workflow not found', code: 'NOT_FOUND' })
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
// edges in one atomic update. Returns the full workflow with the new graph.
router.put(
  '/:workflowId/graph',
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
      const existing = await getOwnedWorkflow(
        req.params.workflowId,
        req.workspaceId!
      )
      if (!existing) {
        res.status(404).json({ error: 'Workflow not found', code: 'NOT_FOUND' })
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
// it to be triggered by cron or webhook events.
router.post(
  '/:workflowId/activate',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const existing = await getOwnedWorkflow(
        req.params.workflowId,
        req.workspaceId!
      )
      if (!existing) {
        res.status(404).json({ error: 'Workflow not found', code: 'NOT_FOUND' })
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
// stopping it from accepting new trigger events.
router.post(
  '/:workflowId/deactivate',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const existing = await getOwnedWorkflow(
        req.params.workflowId,
        req.workspaceId!
      )
      if (!existing) {
        res.status(404).json({ error: 'Workflow not found', code: 'NOT_FOUND' })
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
// the same nodes and edges, appending "(copy)" to the name.
router.post(
  '/:workflowId/duplicate',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const source = await getOwnedWorkflow(
        req.params.workflowId,
        req.workspaceId!
      )
      if (!source) {
        res.status(404).json({ error: 'Workflow not found', code: 'NOT_FOUND' })
        return
      }

      const copy = await prisma.workflow.create({
        data: {
          workspaceId: req.workspaceId!,
          name: `${source.name} (copy)`,
          status: 'DRAFT',
          nodes: toInputJson(source.nodes ?? []),
          edges: toInputJson(source.edges ?? []),
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
// lean { data: { id, name } } payload used by the canvas toolbar for optimistic updates.
router.patch(
  '/:workflowId/name',
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
      const existing = await getOwnedWorkflow(
        req.params.workflowId,
        req.workspaceId!
      )
      if (!existing) {
        res.status(404).json({ error: 'Workflow not found', code: 'NOT_FOUND' })
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
// Responds with 204 No Content on success.
router.delete(
  '/:workflowId',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const existing = await getOwnedWorkflow(
        req.params.workflowId,
        req.workspaceId!
      )
      if (!existing) {
        res.status(404).json({ error: 'Workflow not found', code: 'NOT_FOUND' })
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

export default router
