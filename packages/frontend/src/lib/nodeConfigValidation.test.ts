import { describe, it, expect } from 'vitest'
import {
  isValidUrl,
  isValidJson,
  isValidCron,
  isValidEmail,
  getConfigErrors,
} from '@/lib/nodeConfigValidation'

describe('isValidUrl', () => {
  it('accepts a valid https URL', () => {
    expect(isValidUrl('https://example.com')).toBe(true)
  })

  it('accepts a valid http URL with path', () => {
    expect(isValidUrl('http://api.example.com/users?q=1')).toBe(true)
  })

  it('rejects a plain hostname without protocol', () => {
    expect(isValidUrl('example.com')).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(isValidUrl('')).toBe(false)
  })

  it('rejects random text', () => {
    expect(isValidUrl('not a url')).toBe(false)
  })
})

describe('isValidJson', () => {
  it('accepts valid JSON object', () => {
    expect(isValidJson('{"key": "value"}')).toBe(true)
  })

  it('accepts valid JSON array', () => {
    expect(isValidJson('[1, 2, 3]')).toBe(true)
  })

  it('accepts empty string as valid (treated as empty body)', () => {
    expect(isValidJson('')).toBe(true)
  })

  it('accepts whitespace-only string as valid', () => {
    expect(isValidJson('   ')).toBe(true)
  })

  it('rejects malformed JSON', () => {
    expect(isValidJson('{key: value}')).toBe(false)
  })

  it('rejects unterminated string', () => {
    expect(isValidJson('{"key": "value"')).toBe(false)
  })
})

describe('isValidCron', () => {
  it('accepts a standard 5-part cron expression', () => {
    expect(isValidCron('* * * * *')).toBe(true)
  })

  it('accepts a 6-part cron expression', () => {
    expect(isValidCron('0 9 * * 1-5 *')).toBe(true)
  })

  it('accepts a 7-part cron expression', () => {
    expect(isValidCron('0 0 12 * * * *')).toBe(true)
  })

  it('rejects fewer than 5 parts', () => {
    expect(isValidCron('* * * *')).toBe(false)
  })

  it('rejects more than 7 parts', () => {
    expect(isValidCron('* * * * * * * *')).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(isValidCron('')).toBe(false)
  })
})

describe('isValidEmail', () => {
  it('accepts a standard email address', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
  })

  it('accepts an email with subdomain', () => {
    expect(isValidEmail('user@mail.example.co.uk')).toBe(true)
  })

  it('rejects email without @', () => {
    expect(isValidEmail('userexample.com')).toBe(false)
  })

  it('rejects email without domain extension', () => {
    expect(isValidEmail('user@example')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidEmail('')).toBe(false)
  })

  it('rejects email with spaces', () => {
    expect(isValidEmail('user @example.com')).toBe(false)
  })
})

describe('getConfigErrors', () => {
  const schema = {
    safeParse(data: unknown) {
      const d = data as Record<string, unknown>
      if (!d.url) {
        return {
          success: false as const,
          error: {
            issues: [
              {
                path: ['url'],
                message: 'Too small: expected string to have >=1 characters',
              },
            ],
          },
        }
      }
      return { success: true as const }
    },
  }

  it('returns an empty object for valid config', () => {
    expect(getConfigErrors(schema, { url: 'https://example.com' })).toEqual({})
  })

  it('returns a dotted path → friendly message map for invalid config', () => {
    const errors = getConfigErrors(schema, {})
    expect(errors).toHaveProperty('url')
    expect(errors['url']).toBe('This field is required')
  })

  it('records only the first error per field', () => {
    const multiSchema = {
      safeParse() {
        return {
          success: false as const,
          error: {
            issues: [
              {
                path: ['url'],
                message: 'Too small: expected string to have >=1 characters',
              },
              { path: ['url'], message: 'Invalid input' },
            ],
          },
        }
      },
    }
    const errors = getConfigErrors(multiSchema, {})
    expect(Object.keys(errors).filter((k) => k === 'url')).toHaveLength(1)
  })

  it('handles nested field paths by joining with a dot', () => {
    const nestedSchema = {
      safeParse() {
        return {
          success: false as const,
          error: {
            issues: [
              {
                path: ['headers', 'Authorization'],
                message: 'Too small: expected string to have >=1 characters',
              },
            ],
          },
        }
      },
    }
    const errors = getConfigErrors(nestedSchema, {})
    expect(errors).toHaveProperty('headers.Authorization')
  })
})
