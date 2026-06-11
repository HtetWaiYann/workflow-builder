import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

// Utility that merges Tailwind classes using clsx + tailwind-merge, resolving
// conflicts so the last class wins (e.g. p-4 beats p-2 when both are present).
describe('cn', () => {
  it('returns a single class unchanged', () => {
    expect(cn('text-sm')).toBe('text-sm')
  })

  it('merges multiple classes into one string', () => {
    expect(cn('text-sm', 'font-bold')).toBe('text-sm font-bold')
  })

  it('omits falsy conditional classes', () => {
    expect(cn('text-sm', false && 'hidden', undefined, null)).toBe('text-sm')
  })

  it('resolves conflicting Tailwind classes — last one wins', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles object syntax from clsx', () => {
    expect(cn({ 'font-bold': true, italic: false })).toBe('font-bold')
  })

  it('handles array syntax from clsx', () => {
    expect(cn(['text-sm', 'font-bold'])).toBe('text-sm font-bold')
  })

  it('returns empty string when all args are falsy', () => {
    expect(cn(false, undefined, null)).toBe('')
  })
})
