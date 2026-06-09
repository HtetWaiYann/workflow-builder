import { z } from 'zod'

export const GREETING = 'Hello from @triggr/shared!'

// Node type definitions

/**
 * All available node type keys in the system.
 */
export type NodeType =
  | 'manual-trigger'
  | 'webhook-trigger'
  | 'cron-trigger'
  | 'http-request'
  | 'run-js-code'
  | 'if-condition'
  | 'switch'
  | 'merge'
  | 'set-fields'
  | 'filter-array'
  | 'rename-keys'
  | 'slack-message'
  | 'send-email'
  | 'delay'

/**
 * Group category for a node type.
 */
export type NodeGroup =
  | 'Triggers'
  | 'Actions'
  | 'Logic'
  | 'Transform'
  | 'Notify'

/**
 * Definition of a port (input or output handle) on a node.
 */
export interface PortDefinition {
  /** Handle id used by React Flow */
  id: string
  /** Display label shown on the node */
  label: string
}

/**
 * Static definition of a node type.
 * Describes how a node looks and what ports it has.
 * Does not contain instance data.
 */
export interface NodeTypeDefinition {
  /** The node type key */
  type: NodeType
  /** Display name shown in palette and on canvas */
  label: string
  /** Short description shown in palette */
  description: string
  /** Group this node belongs to */
  group: NodeGroup
  /** Lucide icon name (string) */
  icon: string
  /** Hex color string for the node accent */
  color: string
  /** Input port definitions */
  inputs: PortDefinition[]
  /** Output port definitions */
  outputs: PortDefinition[]
}

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
}).extend({
  runCount: z.number(),
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
  'SKIPPED',
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
  retryCount: z.number().int().default(0),
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
   * @param nodeData - The `data` object from the WorkflowNode, with `{{ $vars.KEY }}` placeholders already resolved.
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

/**
 * Reserved key in executor output for branching nodes (if-condition, switch).
 * The value must match a sourceHandle on one of the node's outgoing edges.
 */
export const BRANCH_HANDLE_KEY = '_activeHandle' as const

/**
 * Handle id for the special error output port on non-trigger nodes.
 * Edges from this handle are activated when the node fails.
 */
export const ERROR_HANDLE_ID = '__error__' as const

// Node error handling schemas

export const NodeErrorPolicySchema = z.enum(['stop', 'continue', 'retry'])
export type NodeErrorPolicy = z.infer<typeof NodeErrorPolicySchema>

/**
 * Per-node error handling configuration stored in node.data.errorConfig.
 */
export const NodeErrorConfigSchema = z.object({
  /** What to do when the node fails (after retries are exhausted). */
  policy: NodeErrorPolicySchema.default('stop'),
  /** Number of retry attempts when policy is 'retry'. */
  retryCount: z.number().int().min(1).max(10).default(1),
  /** Milliseconds to wait between retry attempts. */
  retryDelayMs: z.number().int().min(0).default(1000),
  /** Whether to show and use the error output handle for routing failures. */
  errorBranch: z.boolean().default(false),
})
export type NodeErrorConfig = z.infer<typeof NodeErrorConfigSchema>

// Node config schemas (used by both backend executors and frontend forms)

const HttpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])

export const ManualTriggerConfigSchema = z.object({})

export const WebhookTriggerConfigSchema = z.object({
  method: HttpMethodSchema,
  path: z.string().min(1),
})

export const CronTriggerConfigSchema = z.object({
  schedule: z.string().min(1),
})

export const HttpRequestConfigSchema = z.object({
  url: z.string().min(1),
  method: HttpMethodSchema,
  headers: z.string().default('{}'),
  body: z.string().default('{}'),
})

export const RunJsCodeConfigSchema = z.object({
  code: z.string(),
})

export const IfConditionConfigSchema = z.object({
  field: z.string(),
  operator: z.enum([
    '==',
    '!=',
    '>',
    '<',
    '>=',
    '<=',
    'contains',
    'not contains',
  ]),
  value: z.unknown(),
})

export const SwitchConfigSchema = z.object({
  field: z.string(),
  cases: z.array(z.object({ value: z.string(), label: z.string() })),
})

export const MergeConfigSchema = z.object({})

export const SetFieldsConfigSchema = z.object({
  fields: z.array(z.object({ key: z.string(), value: z.unknown() })),
})

export const FilterArrayConfigSchema = z.object({
  expression: z.string(),
})

export const RenameKeysConfigSchema = z.object({
  mappings: z.array(z.object({ from: z.string(), to: z.string() })),
})

export const SlackMessageConfigSchema = z.object({
  webhookUrl: z.string().min(1),
  message: z.string(),
})

export const SendEmailConfigSchema = z.object({
  to: z.string().min(1),
  subject: z.string(),
  body: z.string(),
  smtpHost: z.string().min(1),
  smtpPort: z.coerce.number().int().positive(),
  smtpUser: z.string().min(1),
  smtpPass: z.string().min(1),
  smtpFrom: z.string().min(1),
})

export const DelayConfigSchema = z.object({
  duration: z.number().positive(),
  unit: z.enum(['seconds', 'minutes', 'hours']),
})

export type ManualTriggerConfig = z.infer<typeof ManualTriggerConfigSchema>
export type WebhookTriggerConfig = z.infer<typeof WebhookTriggerConfigSchema>
export type CronTriggerConfig = z.infer<typeof CronTriggerConfigSchema>
export type HttpRequestConfig = z.infer<typeof HttpRequestConfigSchema>
export type RunJsCodeConfig = z.infer<typeof RunJsCodeConfigSchema>
export type IfConditionConfig = z.infer<typeof IfConditionConfigSchema>
export type SwitchConfig = z.infer<typeof SwitchConfigSchema>
export type MergeConfig = z.infer<typeof MergeConfigSchema>
export type SetFieldsConfig = z.infer<typeof SetFieldsConfigSchema>
export type FilterArrayConfig = z.infer<typeof FilterArrayConfigSchema>
export type RenameKeysConfig = z.infer<typeof RenameKeysConfigSchema>
export type SlackMessageConfig = z.infer<typeof SlackMessageConfigSchema>
export type SendEmailConfig = z.infer<typeof SendEmailConfigSchema>
export type DelayConfig = z.infer<typeof DelayConfigSchema>

// Workspace variable schemas

export const WorkspaceVariableSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  key: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type WorkspaceVariable = z.infer<typeof WorkspaceVariableSchema>

export const CreateWorkspaceVariableRequestSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[A-Z0-9_]+$/,
      'Key must be uppercase letters, numbers, and underscores only'
    ),
  value: z.string().min(1),
})
export const UpdateWorkspaceVariableRequestSchema = z.object({
  value: z.string().min(1),
})

export type CreateWorkspaceVariableRequest = z.infer<
  typeof CreateWorkspaceVariableRequestSchema
>
export type UpdateWorkspaceVariableRequest = z.infer<
  typeof UpdateWorkspaceVariableRequestSchema
>

// Webhook HMAC secret schemas

/** Status response for GET — hint is shown, plaintext is never returned after creation. */
export const WebhookSecretStatusSchema = z.object({
  exists: z.boolean(),
  hint: z.string().nullable(),
})
export type WebhookSecretStatus = z.infer<typeof WebhookSecretStatusSchema>

/** One-time response for POST generate/regenerate — secret must be copied immediately. */
export const WebhookSecretGeneratedSchema = z.object({
  secret: z.string(),
  hint: z.string(),
})
export type WebhookSecretGenerated = z.infer<
  typeof WebhookSecretGeneratedSchema
>

// Auth schemas

/** Request body for `POST /auth/register`. */
export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character'
    ),
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
  createdAt: z.string(),
})

// Workspace membership

export const WorkspaceMemberRoleSchema = z.enum(['OWNER', 'EDITOR', 'VIEWER'])
export type WorkspaceMemberRole = z.infer<typeof WorkspaceMemberRoleSchema>

/** A workspace the user belongs to, with their role in it. */
export const WorkspaceMembershipSchema = z.object({
  workspace: WorkspaceSchema,
  role: WorkspaceMemberRoleSchema,
})
export type WorkspaceMembership = z.infer<typeof WorkspaceMembershipSchema>

/** Full member record including user details — used in member list views. */
export const WorkspaceMemberSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  userId: z.string(),
  role: WorkspaceMemberRoleSchema,
  createdAt: z.string(),
  user: UserSchema,
})
export type WorkspaceMember = z.infer<typeof WorkspaceMemberSchema>

/** Pending workspace invite. */
export const WorkspaceInviteSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  email: z.string(),
  role: WorkspaceMemberRoleSchema,
  token: z.string(),
  expiresAt: z.string(),
  acceptedAt: z.string().nullable(),
  createdAt: z.string(),
  invitedBy: UserSchema,
})
export type WorkspaceInvite = z.infer<typeof WorkspaceInviteSchema>

/** Pending invite summary returned by the list endpoint — token is omitted intentionally. */
export const PendingInviteSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  email: z.string(),
  role: WorkspaceMemberRoleSchema,
  expiresAt: z.string(),
  createdAt: z.string(),
  invitedBy: UserSchema,
})
export type PendingInvite = z.infer<typeof PendingInviteSchema>

// Workspace request schemas

export const CreateWorkspaceRequestSchema = z.object({
  name: z.string().min(1).max(100),
})
export const UpdateWorkspaceNameRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
})
export const InviteMemberRequestSchema = z.object({
  email: z.string().email(),
  role: WorkspaceMemberRoleSchema,
})
export const UpdateMemberRoleRequestSchema = z.object({
  role: WorkspaceMemberRoleSchema,
})
export const AcceptInviteRequestSchema = z.object({
  token: z.string().min(1),
})

export type CreateWorkspaceRequest = z.infer<
  typeof CreateWorkspaceRequestSchema
>
export type UpdateWorkspaceNameRequest = z.infer<
  typeof UpdateWorkspaceNameRequestSchema
>
export type InviteMemberRequest = z.infer<typeof InviteMemberRequestSchema>
export type UpdateMemberRoleRequest = z.infer<
  typeof UpdateMemberRoleRequestSchema
>
export type AcceptInviteRequest = z.infer<typeof AcceptInviteRequestSchema>

/** Response body for login, register, and `GET /auth/me`. */
export const AuthResponseSchema = z.object({
  user: UserSchema,
  workspaces: z.array(WorkspaceMembershipSchema),
})

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>
export type LoginRequest = z.infer<typeof LoginRequestSchema>
export type User = z.infer<typeof UserSchema>
export type Workspace = z.infer<typeof WorkspaceSchema>
export type AuthResponse = z.infer<typeof AuthResponseSchema>
