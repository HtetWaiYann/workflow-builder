import { z } from 'zod'

export const GREETING = 'Hello from @workflow-builder/shared!'

export interface WorkflowNode {
  id: string
  type: string
  label: string
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
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
