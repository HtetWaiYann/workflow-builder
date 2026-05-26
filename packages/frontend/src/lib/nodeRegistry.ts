import {
  Play,
  Webhook,
  Clock,
  Globe,
  Code,
  GitBranch,
  Shuffle,
  Merge,
  PenLine,
  Filter,
  TextCursor,
  MessageSquare,
  Mail,
  Timer,
} from 'lucide-react'
import type {
  NodeType,
  NodeGroup,
  NodeTypeDefinition,
} from '@workflow-builder/shared'

type IconComponent = React.ComponentType<{
  size?: number
  style?: React.CSSProperties
  className?: string
}>

/** Map from Lucide icon name string to the component. Used for dynamic icon rendering. */
export const ICON_MAP: Record<string, IconComponent> = {
  Play,
  Webhook,
  Clock,
  Globe,
  Code,
  GitBranch,
  Shuffle,
  Merge,
  PenLine,
  Filter,
  TextCursor,
  MessageSquare,
  Mail,
  Timer,
}

/** Hex accent colors keyed by group. */
export const GROUP_COLORS: Record<NodeGroup, string> = {
  Triggers: '#F97316',
  Actions: '#3B82F6',
  Logic: '#8B5CF6',
  Transform: '#14B8A6',
  Notify: '#F59E0B',
}

const TRIGGER_COLOR = GROUP_COLORS.Triggers
const ACTION_COLOR = GROUP_COLORS.Actions
const LOGIC_COLOR = GROUP_COLORS.Logic
const TRANSFORM_COLOR = GROUP_COLORS.Transform
const NOTIFY_COLOR = GROUP_COLORS.Notify

const REGISTRY_ENTRIES: NodeTypeDefinition[] = [
  // ── Triggers ──────────────────────────────────────────────────────────────
  {
    type: 'manual-trigger',
    label: 'Manual Trigger',
    description: 'Start workflow manually',
    group: 'Triggers',
    icon: 'Play',
    color: TRIGGER_COLOR,
    inputs: [],
    outputs: [{ id: 'output', label: 'Output' }],
  },
  {
    type: 'webhook-trigger',
    label: 'Webhook Trigger',
    description: 'Start workflow via HTTP webhook',
    group: 'Triggers',
    icon: 'Webhook',
    color: TRIGGER_COLOR,
    inputs: [],
    outputs: [{ id: 'output', label: 'Output' }],
  },
  {
    type: 'cron-trigger',
    label: 'Cron Trigger',
    description: 'Run workflow on a schedule',
    group: 'Triggers',
    icon: 'Clock',
    color: TRIGGER_COLOR,
    inputs: [],
    outputs: [{ id: 'output', label: 'Output' }],
  },
  // ── Actions ───────────────────────────────────────────────────────────────
  {
    type: 'http-request',
    label: 'HTTP Request',
    description: 'Make an HTTP request to any URL',
    group: 'Actions',
    icon: 'Globe',
    color: ACTION_COLOR,
    inputs: [{ id: 'input', label: 'Input' }],
    outputs: [{ id: 'output', label: 'Output' }],
  },
  {
    type: 'run-js-code',
    label: 'Run JS Code',
    description: 'Execute custom JavaScript',
    group: 'Actions',
    icon: 'Code',
    color: ACTION_COLOR,
    inputs: [{ id: 'input', label: 'Input' }],
    outputs: [{ id: 'output', label: 'Output' }],
  },
  // ── Logic ─────────────────────────────────────────────────────────────────
  {
    type: 'if-condition',
    label: 'If / Condition',
    description: 'Branch based on a condition',
    group: 'Logic',
    icon: 'GitBranch',
    color: LOGIC_COLOR,
    inputs: [{ id: 'input', label: 'Input' }],
    outputs: [
      { id: 'true', label: 'True' },
      { id: 'false', label: 'False' },
    ],
  },
  {
    type: 'switch',
    label: 'Switch',
    description: 'Route to one of many branches',
    group: 'Logic',
    icon: 'Shuffle',
    color: LOGIC_COLOR,
    inputs: [{ id: 'input', label: 'Input' }],
    outputs: [
      { id: 'case1', label: 'Case 1' },
      { id: 'case2', label: 'Case 2' },
      { id: 'default', label: 'Default' },
    ],
  },
  {
    type: 'merge',
    label: 'Merge',
    description: 'Combine multiple branches',
    group: 'Logic',
    icon: 'Merge',
    color: LOGIC_COLOR,
    inputs: [
      { id: 'input1', label: 'Input 1' },
      { id: 'input2', label: 'Input 2' },
    ],
    outputs: [{ id: 'output', label: 'Output' }],
  },
  // ── Transform ─────────────────────────────────────────────────────────────
  {
    type: 'set-fields',
    label: 'Set Fields',
    description: 'Add or overwrite fields on data',
    group: 'Transform',
    icon: 'PenLine',
    color: TRANSFORM_COLOR,
    inputs: [{ id: 'input', label: 'Input' }],
    outputs: [{ id: 'output', label: 'Output' }],
  },
  {
    type: 'filter-array',
    label: 'Filter Array',
    description: 'Filter items in an array',
    group: 'Transform',
    icon: 'Filter',
    color: TRANSFORM_COLOR,
    inputs: [{ id: 'input', label: 'Input' }],
    outputs: [{ id: 'output', label: 'Output' }],
  },
  {
    type: 'rename-keys',
    label: 'Rename Keys',
    description: 'Rename keys in an object',
    group: 'Transform',
    icon: 'TextCursor',
    color: TRANSFORM_COLOR,
    inputs: [{ id: 'input', label: 'Input' }],
    outputs: [{ id: 'output', label: 'Output' }],
  },
  // ── Notify ────────────────────────────────────────────────────────────────
  {
    type: 'slack-message',
    label: 'Slack Message',
    description: 'Send a message to Slack',
    group: 'Notify',
    icon: 'MessageSquare',
    color: NOTIFY_COLOR,
    inputs: [{ id: 'input', label: 'Input' }],
    outputs: [{ id: 'output', label: 'Output' }],
  },
  {
    type: 'send-email',
    label: 'Send Email',
    description: 'Send an email via SMTP',
    group: 'Notify',
    icon: 'Mail',
    color: NOTIFY_COLOR,
    inputs: [{ id: 'input', label: 'Input' }],
    outputs: [{ id: 'output', label: 'Output' }],
  },
  {
    type: 'delay',
    label: 'Delay',
    description: 'Wait before continuing',
    group: 'Notify',
    icon: 'Timer',
    color: NOTIFY_COLOR,
    inputs: [{ id: 'input', label: 'Input' }],
    outputs: [{ id: 'output', label: 'Output' }],
  },
]

export const NODE_REGISTRY: Record<NodeType, NodeTypeDefinition> =
  Object.fromEntries(REGISTRY_ENTRIES.map((d) => [d.type, d])) as Record<
    NodeType,
    NodeTypeDefinition
  >

const GROUP_ORDER: NodeGroup[] = [
  'Triggers',
  'Actions',
  'Logic',
  'Transform',
  'Notify',
]

export const NODE_GROUPS: Record<NodeGroup, NodeTypeDefinition[]> =
  Object.fromEntries(
    GROUP_ORDER.map((g) => [g, REGISTRY_ENTRIES.filter((d) => d.group === g)])
  ) as Record<NodeGroup, NodeTypeDefinition[]>

/**
 * Returns the static definition for a node type.
 * @param type - The node type key.
 * @returns The NodeTypeDefinition for the given type.
 */
export function getNodeDefinition(type: NodeType): NodeTypeDefinition {
  return NODE_REGISTRY[type]
}
