import { describe, it, expect } from 'vitest'
import {
  getNodeDefinition,
  NODE_REGISTRY,
  NODE_GROUPS,
  GROUP_COLORS,
  ICON_MAP,
} from '@/lib/nodeRegistry'

// Static registry of all supported node types with their labels, groups, icons,
// and input/output port definitions. Used by the palette, canvas, and docs.
describe('getNodeDefinition', () => {
  it('returns the correct definition for manual-trigger', () => {
    const def = getNodeDefinition('manual-trigger')
    expect(def.type).toBe('manual-trigger')
    expect(def.label).toBe('Manual Trigger')
    expect(def.group).toBe('Triggers')
  })

  it('returns the correct definition for http-request', () => {
    const def = getNodeDefinition('http-request')
    expect(def.type).toBe('http-request')
    expect(def.label).toBe('HTTP Request')
    expect(def.group).toBe('Actions')
  })

  it('returns a definition with inputs and outputs', () => {
    const def = getNodeDefinition('if-condition')
    expect(def.inputs).toHaveLength(1)
    expect(def.outputs).toHaveLength(2)
    expect(def.outputs.map((o) => o.id)).toEqual(['true', 'false'])
  })

  it('returns a trigger with no inputs', () => {
    const def = getNodeDefinition('webhook-trigger')
    expect(def.inputs).toHaveLength(0)
    expect(def.outputs).toHaveLength(1)
  })
})

describe('NODE_REGISTRY', () => {
  it('contains all expected node types', () => {
    const expectedTypes = [
      'manual-trigger',
      'webhook-trigger',
      'cron-trigger',
      'http-request',
      'run-js-code',
      'if-condition',
      'switch',
      'merge',
      'set-fields',
      'filter-array',
      'rename-keys',
      'slack-message',
      'send-email',
      'delay',
    ]
    for (const type of expectedTypes) {
      expect(NODE_REGISTRY).toHaveProperty(type)
    }
  })

  it('each entry has required fields', () => {
    for (const def of Object.values(NODE_REGISTRY)) {
      expect(def.type).toBeTruthy()
      expect(def.label).toBeTruthy()
      expect(def.group).toBeTruthy()
      expect(def.icon).toBeTruthy()
      expect(def.color).toBeTruthy()
      expect(Array.isArray(def.inputs)).toBe(true)
      expect(Array.isArray(def.outputs)).toBe(true)
    }
  })
})

describe('NODE_GROUPS', () => {
  it('organizes trigger nodes into the Triggers group', () => {
    const triggerTypes = NODE_GROUPS['Triggers'].map((d) => d.type)
    expect(triggerTypes).toContain('manual-trigger')
    expect(triggerTypes).toContain('webhook-trigger')
    expect(triggerTypes).toContain('cron-trigger')
  })

  it('organizes action nodes into the Actions group', () => {
    const actionTypes = NODE_GROUPS['Actions'].map((d) => d.type)
    expect(actionTypes).toContain('http-request')
    expect(actionTypes).toContain('run-js-code')
  })

  it('organizes logic nodes into the Logic group', () => {
    const logicTypes = NODE_GROUPS['Logic'].map((d) => d.type)
    expect(logicTypes).toContain('if-condition')
    expect(logicTypes).toContain('switch')
    expect(logicTypes).toContain('merge')
  })

  it('has all five groups', () => {
    expect(Object.keys(NODE_GROUPS)).toEqual([
      'Triggers',
      'Actions',
      'Logic',
      'Transform',
      'Notify',
    ])
  })
})

describe('GROUP_COLORS', () => {
  it('defines a color for each group', () => {
    expect(GROUP_COLORS.Triggers).toBeTruthy()
    expect(GROUP_COLORS.Actions).toBeTruthy()
    expect(GROUP_COLORS.Logic).toBeTruthy()
    expect(GROUP_COLORS.Transform).toBeTruthy()
    expect(GROUP_COLORS.Notify).toBeTruthy()
  })
})

describe('ICON_MAP', () => {
  it('contains all icons referenced by node definitions', () => {
    for (const def of Object.values(NODE_REGISTRY)) {
      expect(ICON_MAP).toHaveProperty(def.icon)
      expect(ICON_MAP[def.icon]).toBeDefined()
    }
  })
})
