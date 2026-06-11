export type NodeCategory =
  | 'Trigger'
  | 'Action'
  | 'Logic'
  | 'Transform'
  | 'Notify'

export interface DocField {
  name: string
  required: boolean
  description: string
}

export interface DocExample {
  label: string
  value: string
}

export interface EnvVarItem {
  key: string
  desc: string
}

export interface IntroCard {
  step: string
  title: string
  desc: string
}

export type ContentBlock =
  | { type: 'text'; content: string }
  | { type: 'heading'; content: string }
  | { type: 'code-block'; content: string; variant?: 'var' }
  | { type: 'note'; content: string }
  | { type: 'steps'; items: string[]; start?: number }
  | { type: 'bullet-list'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'fields-table'; fields: DocField[] }
  | { type: 'examples'; items: DocExample[] }
  | { type: 'tips'; items: string[] }
  | { type: 'intro-cards'; cards: IntroCard[] }
  | { type: 'node-header'; category: NodeCategory }
  | { type: 'env-vars-list'; items: EnvVarItem[] }

export interface DocPageData {
  id: string
  title: string
  blocks: ContentBlock[]
}
