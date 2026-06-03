import { Router } from 'express'
import type { Response } from 'express'
import { randomBytes } from 'node:crypto'
import type { AuthRequest } from '../middleware/auth'
import { requireRole } from '../middleware/role'
import { prisma } from '../db/client'
import { logger } from '../lib/logger'
import { encrypt } from '../services/encryptionService'

export const webhookSecretsRouter = Router({ mergeParams: true })

function generateSecret(): string {
  return randomBytes(32).toString('hex')
}

function computeHint(secret: string): string {
  return secret.slice(0, 4) + '••••••••' + secret.slice(-4)
}

/**
 * Look up a workflow and verify it belongs to the request's workspace.
 * Returns null and sends 404 if not found.
 */
async function getOwnedWorkflow(
  workflowId: string,
  workspaceId: string,
  res: Response
): Promise<boolean> {
  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, workspaceId },
    select: { id: true },
  })
  if (!workflow) {
    res.status(404).json({ error: 'Workflow not found', code: 'NOT_FOUND' })
    return false
  }
  return true
}

// Get HMAC secret status for a webhook trigger node.
// Returns only the masked hint — the plaintext secret is never retrievable after generation.
webhookSecretsRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const { workflowId, nodeId } = req.params as {
      workflowId: string
      nodeId: string
    }

    if (!(await getOwnedWorkflow(workflowId, req.workspaceId!, res))) return

    const record = await prisma.workflowNodeSecret.findUnique({
      where: { workflowId_nodeId: { workflowId, nodeId } },
      select: { hint: true },
    })

    res.json({ exists: !!record, hint: record?.hint ?? null })
  } catch (err) {
    logger.error({ err }, 'Error fetching webhook secret status')
    res
      .status(500)
      .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})

// Generate or regenerate the HMAC secret for a webhook trigger node.
// The plaintext secret is returned ONCE in this response — it is never stored.
// Calling again invalidates the previous secret immediately. OWNER only.
webhookSecretsRouter.post(
  '/',
  requireRole('OWNER'),
  async (req: AuthRequest, res) => {
    try {
      const { workflowId, nodeId } = req.params as {
        workflowId: string
        nodeId: string
      }

      if (!(await getOwnedWorkflow(workflowId, req.workspaceId!, res))) return

      const plaintext = generateSecret()
      const { encryptedValue, iv, authTag } = encrypt(plaintext)
      const hint = computeHint(plaintext)

      await prisma.workflowNodeSecret.upsert({
        where: { workflowId_nodeId: { workflowId, nodeId } },
        create: { workflowId, nodeId, encryptedValue, iv, authTag, hint },
        update: { encryptedValue, iv, authTag, hint },
      })

      logger.info({ workflowId, nodeId }, 'Webhook HMAC secret generated')

      res.status(201).json({ secret: plaintext, hint })
    } catch (err) {
      logger.error({ err }, 'Error generating webhook secret')
      res
        .status(500)
        .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  }
)

// Disable HMAC authentication by permanently deleting the secret. OWNER only.
webhookSecretsRouter.delete(
  '/',
  requireRole('OWNER'),
  async (req: AuthRequest, res) => {
    try {
      const { workflowId, nodeId } = req.params as {
        workflowId: string
        nodeId: string
      }

      if (!(await getOwnedWorkflow(workflowId, req.workspaceId!, res))) return

      const existing = await prisma.workflowNodeSecret.findUnique({
        where: { workflowId_nodeId: { workflowId, nodeId } },
        select: { id: true },
      })
      if (!existing) {
        res
          .status(404)
          .json({ error: 'No HMAC secret configured', code: 'NOT_FOUND' })
        return
      }

      await prisma.workflowNodeSecret.delete({
        where: { workflowId_nodeId: { workflowId, nodeId } },
      })

      logger.info({ workflowId, nodeId }, 'Webhook HMAC secret deleted')
      res.status(204).send()
    } catch (err) {
      logger.error({ err }, 'Error deleting webhook secret')
      res
        .status(500)
        .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  }
)
