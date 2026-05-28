import { describe, it, expect } from 'vitest'
import { resolveVariables } from './variableResolver'

// Recursively replaces {{ $vars.KEY }} and {{ $input.key }} placeholders in a node
// data object. $vars keys come from workspace secrets; $input keys reference the
// immediately upstream node's output.
describe('resolveVariables', () => {
  describe('$vars substitution', () => {
    it('replaces a single $vars placeholder with the matching workspace variable', () => {
      const result = resolveVariables(
        { config: { host: '{{ $vars.SMTP_HOST }}' } },
        { SMTP_HOST: 'mail.example.com' }
      )
      expect(result).toEqual({ config: { host: 'mail.example.com' } })
    })

    it('replaces multiple $vars placeholders in the same string', () => {
      const result = resolveVariables(
        {
          config: { dsn: '{{ $vars.DB_USER }}:{{ $vars.DB_PASS }}@localhost' },
        },
        { DB_USER: 'admin', DB_PASS: 'secret' }
      )
      expect(result).toEqual({ config: { dsn: 'admin:secret@localhost' } })
    })

    it('throws when a referenced $vars key is absent from the variables map', () => {
      expect(() =>
        resolveVariables({ config: { host: '{{ $vars.MISSING }}' } }, {})
      ).toThrow(
        "Variable '$vars.MISSING' is not defined in workspace variables"
      )
    })

    it('defaults to empty inputData when the third argument is omitted', () => {
      const result = resolveVariables(
        { label: '{{ $vars.NAME }}' },
        { NAME: 'hello' }
      )
      expect(result).toEqual({ label: 'hello' })
    })
  })

  describe('$input substitution', () => {
    it('replaces a $input.key placeholder with the matching field from inputData', () => {
      const result = resolveVariables(
        { config: { greeting: 'Hello {{ $input.name }}' } },
        {},
        { name: 'Alice' }
      )
      expect(result).toEqual({ config: { greeting: 'Hello Alice' } })
    })

    it('resolves dot-notation paths like $input.user.email', () => {
      const result = resolveVariables(
        { config: { to: '{{ $input.user.email }}' } },
        {},
        { user: { email: 'alice@example.com' } }
      )
      expect(result).toEqual({ config: { to: 'alice@example.com' } })
    })

    it('throws when a $input path is not present in inputData', () => {
      expect(() =>
        resolveVariables({ config: { v: '{{ $input.missing }}' } }, {}, {})
      ).toThrow(
        "Input field '$input.missing' is not present in the upstream node output"
      )
    })

    it('converts non-string $input values to strings', () => {
      const result = resolveVariables(
        { config: { count: 'total: {{ $input.count }}' } },
        {},
        { count: 42 }
      )
      expect(result).toEqual({ config: { count: 'total: 42' } })
    })
  })

  describe('mixed substitution', () => {
    it('resolves both $vars and $input placeholders in the same string', () => {
      const result = resolveVariables(
        { config: { subject: '{{ $vars.PREFIX }}: {{ $input.title }}' } },
        { PREFIX: 'Alert' },
        { title: 'Server Down' }
      )
      expect(result).toEqual({ config: { subject: 'Alert: Server Down' } })
    })
  })

  describe('deep traversal', () => {
    it('resolves placeholders inside nested objects', () => {
      const result = resolveVariables(
        { smtp: { host: '{{ $vars.HOST }}', port: 587 } },
        { HOST: 'smtp.example.com' }
      )
      expect(result).toEqual({ smtp: { host: 'smtp.example.com', port: 587 } })
    })

    it('resolves placeholders inside arrays', () => {
      const result = resolveVariables(
        { tags: ['{{ $vars.TAG_A }}', '{{ $vars.TAG_B }}'] },
        { TAG_A: 'foo', TAG_B: 'bar' }
      )
      expect(result).toEqual({ tags: ['foo', 'bar'] })
    })

    it('leaves non-string primitive values unchanged', () => {
      const result = resolveVariables(
        { count: 5, active: true, ratio: 0.5 },
        {}
      )
      expect(result).toEqual({ count: 5, active: true, ratio: 0.5 })
    })

    it('passes through null values unchanged', () => {
      const result = resolveVariables({ value: null }, {})
      expect(result).toEqual({ value: null })
    })
  })
})
