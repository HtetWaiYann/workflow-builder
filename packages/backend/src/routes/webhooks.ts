import { Router } from 'express'
import { z } from 'zod'
import {
  WorkflowNodeSchema,
  WorkflowEdgeSchema,
} from '@workflow-builder/shared'
import type { Prisma } from '../generated/prisma/client'
import { prisma } from '../db/client'
import { logger } from '../lib/logger'
import { runWorkflow } from '../engine/runner'

const toJson = (v: Record<string, unknown>): Prisma.InputJsonValue =>
  v as unknown as Prisma.InputJsonValue

export const webhooksRouter = Router()

const WebhookPathSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Path may only contain letters, numbers, hyphens, and underscores'
  )

// Receive an inbound webhook and trigger all matching active workflows.
// Multiple workflows with the same webhook path all fire in parallel.
// No authentication — this endpoint is publicly accessible.
webhooksRouter.post('/:webhookPath', async (req, res) => {
  try {
    const pathResult = WebhookPathSchema.safeParse(req.params.webhookPath)
    if (!pathResult.success) {
      res
        .status(400)
        .json({ error: 'Invalid webhook path', code: 'VALIDATION_ERROR' })
      return
    }

    const webhookPath = `/${pathResult.data}`

    const activeWorkflows = await prisma.workflow.findMany({
      where: { status: 'ACTIVE' },
    })

    // Build the shared input data from the incoming request
    const inputData: Record<string, unknown> = {
      body: req.body as unknown,
      query: req.query,
      // Strip sensitive headers before storing
      headers: Object.fromEntries(
        Object.entries(req.headers).filter(
          ([key]) => !['authorization', 'cookie'].includes(key.toLowerCase())
        )
      ),
    }

    type Match = {
      workflowId: string
      nodes: z.infer<typeof WorkflowNodeSchema>[]
      edges: z.infer<typeof WorkflowEdgeSchema>[]
    }

    // Collect all workflows whose webhook-trigger node path matches
    const matches: Match[] = []
    for (const wf of activeWorkflows) {
      const nodes = z.array(WorkflowNodeSchema).catch([]).parse(wf.nodes)
      const edges = z.array(WorkflowEdgeSchema).catch([]).parse(wf.edges)

      const hasMatch = nodes.some(
        (n) =>
          n.type === 'webhook-trigger' &&
          typeof n.data['config'] === 'object' &&
          n.data['config'] !== null &&
          (n.data['config'] as Record<string, unknown>)['path'] === webhookPath
      )

      if (hasMatch) {
        matches.push({ workflowId: wf.id, nodes, edges })
      }
    }

    if (matches.length === 0) {
      // Always 202 — a distinct status or body would let callers enumerate
      // which webhook paths are active via wordlist attacks.
      res.status(202).json({ message: 'Accepted' })
      return
    }

    // Create executions for all matching workflows and fire them in parallel
    for (const match of matches) {
      const execution = await prisma.$transaction(async (tx) => {
        const exec = await tx.execution.create({
          data: {
            workflowId: match.workflowId,
            status: 'PENDING',
            inputData: toJson(inputData),
          },
        })
        if (match.nodes.length > 0) {
          await tx.executionNodeRun.createMany({
            data: match.nodes.map((n) => ({
              executionId: exec.id,
              nodeId: n.id,
              status: 'PENDING' as const,
            })),
          })
        }
        return exec
      })

      void runWorkflow(execution.id, match.nodes, match.edges, inputData)

      logger.info(
        {
          workflowId: match.workflowId,
          executionId: execution.id,
          webhookPath,
        },
        'Webhook triggered workflow execution'
      )
    }

    // Never expose execution IDs — callers could use them to confirm a
    // webhook path exists by checking whether the body changes.
    res.status(202).json({ message: 'Accepted' })
  } catch (err) {
    logger.error({ err }, 'Webhook handler error')
    res
      .status(500)
      .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})
