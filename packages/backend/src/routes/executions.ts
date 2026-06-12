import { Router } from 'express'
import type { Response } from 'express'
import { z } from 'zod'
import {
  TriggerExecutionRequestSchema,
  WorkflowNodeSchema,
  WorkflowEdgeSchema,
  ExecutionStatusSchema,
  NodeRunStatusSchema,
} from '@triggr/shared'
import type {
  Execution,
  ExecutionSummary,
  ExecutionNodeRun,
} from '@triggr/shared'
import type { Prisma } from '../generated/prisma/client'
import { prisma } from '../db/client'
import { logger } from '../lib/logger'
import { requireAuth } from '../middleware/auth'
import type { AuthRequest } from '../middleware/auth'
import { requireWorkspace } from '../middleware/workspace'
import { runWorkflow } from '../engine/runner'

// ── Format helpers ────────────────────────────────────────────────────────────

type PrismaNodeRun = {
  id: string
  executionId: string
  nodeId: string
  status: string
  inputData: unknown
  outputData: unknown
  error: string | null
  retryCount: number
  startedAt: Date | null
  finishedAt: Date | null
}

type PrismaExecution = {
  id: string
  workflowId: string
  status: string
  inputData: unknown
  startedAt: Date | null
  finishedAt: Date | null
  createdAt: Date
  nodeRuns?: PrismaNodeRun[]
}

const parseJsonRecord = (raw: unknown): Record<string, unknown> | null => {
  if (raw === null || raw === undefined) return null
  const parsed = z.record(z.string(), z.unknown()).safeParse(raw)
  return parsed.success ? parsed.data : null
}

const formatNodeRun = (r: PrismaNodeRun): ExecutionNodeRun => ({
  id: r.id,
  executionId: r.executionId,
  nodeId: r.nodeId,
  status: NodeRunStatusSchema.catch('PENDING').parse(r.status),
  inputData: parseJsonRecord(r.inputData),
  outputData: parseJsonRecord(r.outputData),
  error: r.error,
  retryCount: r.retryCount,
  startedAt: r.startedAt?.toISOString() ?? null,
  finishedAt: r.finishedAt?.toISOString() ?? null,
})

const formatExecutionSummary = (e: PrismaExecution): ExecutionSummary => ({
  id: e.id,
  workflowId: e.workflowId,
  status: ExecutionStatusSchema.catch('PENDING').parse(e.status),
  inputData: parseJsonRecord(e.inputData),
  startedAt: e.startedAt?.toISOString() ?? null,
  finishedAt: e.finishedAt?.toISOString() ?? null,
  createdAt: e.createdAt.toISOString(),
})

const formatExecution = (
  e: PrismaExecution & { nodeRuns: PrismaNodeRun[] }
): Execution => ({
  ...formatExecutionSummary(e),
  nodeRuns: e.nodeRuns.map(formatNodeRun),
})

// ── Sub-router (mounted at /workflows/:workflowId/executions) ─────────────────
// Auth + workspace middleware already applied by the parent workflow router.

const executionSubRouter = Router({ mergeParams: true })

// POST /workflows/:workflowId/executions — Triggers a new workflow run. Creates the execution
// record and node run stubs in a transaction, then fires runWorkflow as a background job
// (fire-and-forget). Responds immediately with 202 so the client can poll for status.
executionSubRouter.post(
  '/',
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = TriggerExecutionRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message ?? 'Invalid request',
        code: 'VALIDATION_ERROR',
      })
      return
    }

    try {
      const workflow = await prisma.workflow.findFirst({
        where: { id: req.params.workflowId, workspaceId: req.workspaceId },
      })

      if (!workflow) {
        res.status(404).json({ error: 'Workflow not found', code: 'NOT_FOUND' })
        return
      }

      const nodes = z.array(WorkflowNodeSchema).catch([]).parse(workflow.nodes)
      const edges = z.array(WorkflowEdgeSchema).catch([]).parse(workflow.edges)
      const inputData = parsed.data.inputData ?? {}

      const execution = await prisma.$transaction(async (tx) => {
        const created = await tx.execution.create({
          data: {
            workflowId: workflow.id,
            status: 'PENDING',
            inputData: inputData as unknown as Prisma.InputJsonValue,
          },
        })

        if (nodes.length > 0) {
          await tx.executionNodeRun.createMany({
            data: nodes.map((n) => ({
              executionId: created.id,
              nodeId: n.id,
              status: 'PENDING' as const,
            })),
          })
        }

        return created
      })

      // Fire and forget — client polls GET /executions/:id for status
      void runWorkflow(execution.id, nodes, edges, inputData)

      res.status(202).json({ execution: formatExecutionSummary(execution) })
    } catch (err) {
      logger.error({ err }, 'POST /workflows/:id/executions failed')
      res
        .status(500)
        .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  }
)

// GET /workflows/:workflowId/executions — Lists recent executions for a workflow. Accepts an
// optional ?limit query param (1–100, default 20), ordered by most recently created.
executionSubRouter.get(
  '/',
  async (req: AuthRequest, res: Response): Promise<void> => {
    const limitRaw = Number(req.query['limit'] ?? 20)
    const limit = Math.min(Math.max(1, isNaN(limitRaw) ? 20 : limitRaw), 100)

    try {
      const workflow = await prisma.workflow.findFirst({
        where: { id: req.params.workflowId, workspaceId: req.workspaceId },
        select: { id: true },
      })

      if (!workflow) {
        res.status(404).json({ error: 'Workflow not found', code: 'NOT_FOUND' })
        return
      }

      const executions = await prisma.execution.findMany({
        where: { workflowId: workflow.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })

      res.json({ executions: executions.map(formatExecutionSummary) })
    } catch (err) {
      logger.error({ err }, 'GET /workflows/:id/executions failed')
      res
        .status(500)
        .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  }
)

export default executionSubRouter

// ── Node test router (mounted at /workflows/:workflowId/nodes/:nodeId) ─────────
// Auth + workspace middleware already applied by the parent workflow router.

export const nodeTestRouter = Router({ mergeParams: true })

// POST /workflows/:workflowId/nodes/:nodeId/test — Runs a single node in isolation using
// the node data provided in the request body (so unsaved canvas changes are tested too).
// Creates a minimal execution + node run record, awaits runWorkflow synchronously (fast
// for one node), and returns the completed node run including output or error.
nodeTestRouter.post(
  '/test',
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = z.object({ node: WorkflowNodeSchema }).safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message ?? 'Invalid request',
        code: 'VALIDATION_ERROR',
      })
      return
    }

    try {
      const workflow = await prisma.workflow.findFirst({
        where: { id: req.params.workflowId, workspaceId: req.workspaceId },
        select: { id: true },
      })
      if (!workflow) {
        res.status(404).json({ error: 'Workflow not found', code: 'NOT_FOUND' })
        return
      }

      const { node } = parsed.data

      const execution = await prisma.$transaction(async (tx) => {
        const created = await tx.execution.create({
          data: {
            workflowId: workflow.id,
            status: 'PENDING',
            inputData: {} as unknown as Prisma.InputJsonValue,
          },
        })
        await tx.executionNodeRun.create({
          data: { executionId: created.id, nodeId: node.id, status: 'PENDING' },
        })
        return created
      })

      await runWorkflow(execution.id, [node], [], {})

      const nodeRun = await prisma.executionNodeRun.findFirst({
        where: { executionId: execution.id, nodeId: node.id },
      })
      if (!nodeRun) {
        res
          .status(500)
          .json({ error: 'Node run record not found', code: 'INTERNAL_ERROR' })
        return
      }

      res.json({ nodeRun: formatNodeRun(nodeRun) })
    } catch (err) {
      logger.error({ err }, 'POST /workflows/:id/nodes/:nodeId/test failed')
      res
        .status(500)
        .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  }
)

// ── Detail router (mounted at /executions) ────────────────────────────────────

export const executionDetailRouter = Router()

executionDetailRouter.use(requireAuth, requireWorkspace)

// GET /executions/:executionId — Fetches a single execution by id including all node run
// records, ordered by start time. Returns 404 if the execution belongs to a different workspace.
executionDetailRouter.get(
  '/:executionId',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const execution = await prisma.execution.findUnique({
        where: { id: req.params.executionId },
        include: {
          nodeRuns: { orderBy: { startedAt: 'asc' } },
          workflow: { select: { workspaceId: true } },
        },
      })

      if (!execution || execution.workflow.workspaceId !== req.workspaceId) {
        res
          .status(404)
          .json({ error: 'Execution not found', code: 'NOT_FOUND' })
        return
      }

      res.json({ execution: formatExecution(execution) })
    } catch (err) {
      logger.error({ err }, 'GET /executions/:id failed')
      res
        .status(500)
        .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  }
)
