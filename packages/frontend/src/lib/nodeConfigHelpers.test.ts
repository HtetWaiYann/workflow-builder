import { describe, it, expect } from 'vitest'
import {
  str,
  num,
  arr,
  HTTP_METHODS,
  IF_OPERATORS,
  DELAY_UNITS,
} from '@/lib/nodeConfigHelpers'

// Pure utility functions and option constants shared by all NodeConfigForm sub-components.
describe('nodeConfigHelpers', () => {
  describe('str', () => {
    it('returns the string value when the key exists and holds a string', () => {
      expect(str({ method: 'POST' }, 'method')).toBe('POST')
    })

    it('returns the fallback when the key is missing', () => {
      expect(str({}, 'method', 'GET')).toBe('GET')
    })

    it('returns the fallback when the value is not a string', () => {
      expect(str({ count: 42 }, 'count', 'default')).toBe('default')
    })

    it('returns an empty string as the default fallback', () => {
      expect(str({}, 'missing')).toBe('')
    })
  })

  describe('num', () => {
    it('returns the numeric value when the key exists and holds a number', () => {
      expect(num({ duration: 30 }, 'duration', 1)).toBe(30)
    })

    it('returns the fallback when the key is missing', () => {
      expect(num({}, 'duration', 5)).toBe(5)
    })

    it('returns the fallback when the value is not a number', () => {
      expect(num({ duration: '30' }, 'duration', 1)).toBe(1)
    })

    it('returns 0 correctly without falling back to the fallback', () => {
      expect(num({ duration: 0 }, 'duration', 99)).toBe(0)
    })
  })

  describe('arr', () => {
    it('returns the array when the key holds an array', () => {
      const cases = [{ value: 'a', label: 'A' }]
      expect(arr({ cases }, 'cases')).toEqual(cases)
    })

    it('returns an empty array when the key is missing', () => {
      expect(arr({}, 'items')).toEqual([])
    })

    it('returns an empty array when the value is not an array', () => {
      expect(arr({ items: 'not-an-array' }, 'items')).toEqual([])
    })

    it('returns an empty array when the value is null', () => {
      expect(arr({ items: null }, 'items')).toEqual([])
    })
  })

  describe('HTTP_METHODS', () => {
    it('contains exactly GET, POST, PUT, PATCH, DELETE in that order', () => {
      expect(HTTP_METHODS).toEqual(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
    })
  })

  describe('IF_OPERATORS', () => {
    it('contains 8 operators', () => {
      expect(IF_OPERATORS).toHaveLength(8)
    })

    it('includes the equality and contains operators', () => {
      const values = IF_OPERATORS.map((op) => op.value)
      expect(values).toContain('==')
      expect(values).toContain('contains')
      expect(values).toContain('not contains')
    })
  })

  describe('DELAY_UNITS', () => {
    it('contains seconds, minutes, and hours', () => {
      const values = DELAY_UNITS.map((u) => u.value)
      expect(values).toEqual(['seconds', 'minutes', 'hours'])
    })
  })
})
