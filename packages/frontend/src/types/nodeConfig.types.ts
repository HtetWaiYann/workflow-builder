/** Frontend-only config shapes stored in node.data.config per node type. */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type IfOperator =
  | '=='
  | '!='
  | '>'
  | '<'
  | '>='
  | '<='
  | 'contains'
  | 'not contains'

export type DelayUnit = 'seconds' | 'minutes' | 'hours'

export interface WebhookTriggerConfig {
  method: HttpMethod
  path: string
}

export interface CronTriggerConfig {
  schedule: string
}

export interface HttpRequestConfig {
  url: string
  method: HttpMethod
  headers: string
  body: string
}

export interface RunJsCodeConfig {
  code: string
}

export interface IfConditionConfig {
  field: string
  operator: IfOperator
  value: string
}

export interface SwitchCase {
  value: string
  label: string
}

export interface SwitchConfig {
  field: string
  cases: SwitchCase[]
}

export interface SetField {
  key: string
  value: string
}

export interface SetFieldsConfig {
  fields: SetField[]
}

export interface FilterArrayConfig {
  expression: string
}

export interface RenameMapping {
  from: string
  to: string
}

export interface RenameKeysConfig {
  mappings: RenameMapping[]
}

export interface SlackMessageConfig {
  webhookUrl: string
  message: string
}

export interface SendEmailConfig {
  to: string
  subject: string
  body: string
}

export interface DelayConfig {
  duration: number
  unit: DelayUnit
}
