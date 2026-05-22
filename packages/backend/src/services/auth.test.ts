import { describe, it, expect, beforeEach } from 'vitest'
import { hashPassword, verifyPassword, signToken, verifyToken } from './auth'

// Hashes a plaintext password using bcrypt. The result must be irreversible and
// salted so the same input never produces the same output twice.
describe('hashPassword', () => {
  it('returns a bcrypt hash different from the plaintext', async () => {
    const hash = await hashPassword('secret123')
    expect(hash).not.toBe('secret123')
    expect(hash).toMatch(/^\$2[aby]\$/)
  })

  it('produces a different salt each call', async () => {
    const h1 = await hashPassword('secret123')
    const h2 = await hashPassword('secret123')
    expect(h1).not.toBe(h2)
  })
})

// Compares a plaintext password against a stored bcrypt hash. Returns true only
// when the plaintext matches the hash that was originally produced from it.
describe('verifyPassword', () => {
  it('returns true for the correct password', async () => {
    const hash = await hashPassword('correct-horse')
    expect(await verifyPassword('correct-horse', hash)).toBe(true)
  })

  it('returns false for the wrong password', async () => {
    const hash = await hashPassword('correct-horse')
    expect(await verifyPassword('wrong-password', hash)).toBe(false)
  })
})

// Full JWT lifecycle: signs a token embedding the user's id and email, then
// verifies it back. Also covers guard rails — missing secret and tokens signed
// with the wrong secret must both throw.
describe('signToken / verifyToken', () => {
  const secret = 'test-secret-at-least-32-chars-long!!'

  beforeEach(() => {
    process.env.JWT_SECRET = secret
    process.env.JWT_EXPIRES_IN = '7d'
  })

  it('signs a token and verifies it successfully', () => {
    const token = signToken({ id: 'user-1', email: 'a@example.com' })
    const payload = verifyToken(token)
    expect(payload.sub).toBe('user-1')
    expect(payload.email).toBe('a@example.com')
  })

  it('throws when JWT_SECRET is not set', () => {
    delete process.env.JWT_SECRET
    expect(() => signToken({ id: 'x', email: 'x@x.com' })).toThrow(
      'JWT_SECRET is not set'
    )
  })

  it('throws when verifying an invalid token', () => {
    expect(() => verifyToken('not.a.jwt')).toThrow()
  })

  it('throws when verifying a token signed with a different secret', () => {
    process.env.JWT_SECRET = 'secret-a'
    const token = signToken({ id: 'x', email: 'x@x.com' })
    process.env.JWT_SECRET = 'secret-b'
    expect(() => verifyToken(token)).toThrow()
  })
})
