import { z } from 'zod'

export const GREETING = 'Hello from @workflow-builder/shared!'

// Workflow node / edge schemas (React Flow shape)

export const WorkflowNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.record(z.string(), z.unknown()),
})

export const WorkflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().nullable().optional(),
  targetHandle: z.string().nullable().optional(),
})

export type WorkflowNode = z.infer<typeof WorkflowNodeSchema>
export type WorkflowEdge = z.infer<typeof WorkflowEdgeSchema>

// Workflow schemas

export const WorkflowStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'INACTIVE'])
export type WorkflowStatus = z.infer<typeof WorkflowStatusSchema>

/** Full workflow object — includes nodes and edges (canvas view). */
export const WorkflowSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  status: WorkflowStatusSchema,
  nodes: z.array(WorkflowNodeSchema),
  edges: z.array(WorkflowEdgeSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type Workflow = z.infer<typeof WorkflowSchema>

/** Lightweight workflow summary — no nodes or edges (list view). */
export const WorkflowSummarySchema = WorkflowSchema.omit({
  nodes: true,
  edges: true,
})
export type WorkflowSummary = z.infer<typeof WorkflowSummarySchema>

// Workflow request schemas

export const CreateWorkflowRequestSchema = z.object({
  name: z.string().min(1).max(255),
})
export const RenameWorkflowRequestSchema = z.object({
  name: z.string().min(1).max(255),
})
export const SaveWorkflowRequestSchema = z.object({
  nodes: z.array(WorkflowNodeSchema),
  edges: z.array(WorkflowEdgeSchema),
})
export const TriggerExecutionRequestSchema = z.object({
  inputData: z.record(z.string(), z.unknown()).optional(),
})

export type CreateWorkflowRequest = z.infer<typeof CreateWorkflowRequestSchema>
export type RenameWorkflowRequest = z.infer<typeof RenameWorkflowRequestSchema>
export type SaveWorkflowRequest = z.infer<typeof SaveWorkflowRequestSchema>
export type TriggerExecutionRequest = z.infer<
  typeof TriggerExecutionRequestSchema
>

// Execution schemas

export const ExecutionStatusSchema = z.enum([
  'PENDING',
  'RUNNING',
  'SUCCESS',
  'ERROR',
])
export const NodeRunStatusSchema = z.enum([
  'PENDING',
  'RUNNING',
  'SUCCESS',
  'ERROR',
])
export type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>
export type NodeRunStatus = z.infer<typeof NodeRunStatusSchema>

export const ExecutionNodeRunSchema = z.object({
  id: z.string(),
  executionId: z.string(),
  nodeId: z.string(),
  status: NodeRunStatusSchema,
  inputData: z.record(z.string(), z.unknown()).nullable(),
  outputData: z.record(z.string(), z.unknown()).nullable(),
  error: z.string().nullable(),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
})
export type ExecutionNodeRun = z.infer<typeof ExecutionNodeRunSchema>

export const ExecutionSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  status: ExecutionStatusSchema,
  inputData: z.record(z.string(), z.unknown()).nullable(),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
  createdAt: z.string(),
  nodeRuns: z.array(ExecutionNodeRunSchema),
})
export type Execution = z.infer<typeof ExecutionSchema>

/** Lightweight execution summary — no nodeRuns (list view). */
export const ExecutionSummarySchema = ExecutionSchema.omit({ nodeRuns: true })
export type ExecutionSummary = z.infer<typeof ExecutionSummarySchema>

// Engine interfaces (framework-agnostic)

export interface ExecutionContext {
  executionId: string
  workflowId: string
  /** Resolved output of each completed node, keyed by nodeId. */
  nodeOutputs: Record<string, Record<string, unknown>>
}

/**
 * Interface every node executor must implement.
 * Executors live in packages/backend/src/engine/nodes/ and must not import Express.
 */
export interface NodeExecutor {
  readonly type: string
  /**
   * Executes the node logic.
   * @param nodeData - The `data` object from the WorkflowNode (node config).
   * @param inputData - Resolved output of the immediately upstream node, or the trigger input for the first node.
   * @param context - Execution-wide context including all prior node outputs.
   * @returns The output data produced by this node.
   * @throws If the node fails — the runner catches this and records the error.
   */
  execute(
    nodeData: Record<string, unknown>,
    inputData: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<Record<string, unknown>>
}

// Auth schemas

/** Request body for `POST /auth/register`. */
export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
})

/** Request body for `POST /auth/login`. */
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

/** Shape of a user object returned by the API. */
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  createdAt: z.string(),
})

/** Shape of a workspace object returned by the API. */
export const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  userId: z.string(),
  createdAt: z.string(),
})

/** Response body for login, register, and `GET /auth/me`. */
export const AuthResponseSchema = z.object({
  user: UserSchema,
  workspace: WorkspaceSchema.nullable(),
})

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>
export type LoginRequest = z.infer<typeof LoginRequestSchema>
export type User = z.infer<typeof UserSchema>
export type Workspace = z.infer<typeof WorkspaceSchema>
export type AuthResponse = z.infer<typeof AuthResponseSchema>
