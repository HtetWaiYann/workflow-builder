import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { encrypt, decrypt } from './encryptionService'

const VALID_KEY = 'a'.repeat(64) // 64 hex chars = 32 bytes

// AES-256-GCM encryption/decryption service for workspace variables.
describe('encrypt / decrypt', () => {
  beforeEach(() => {
    process.env['ENCRYPTION_KEY'] = VALID_KEY
  })

  afterEach(() => {
    delete process.env['ENCRYPTION_KEY']
  })

  it('encrypt returns encryptedValue, iv, and authTag as base64 strings', () => {
    const result = encrypt('hello')
    expect(typeof result.encryptedValue).toBe('string')
    expect(typeof result.iv).toBe('string')
    expect(typeof result.authTag).toBe('string')
    // Verify they are valid base64 (no error when decoding)
    expect(() => Buffer.from(result.encryptedValue, 'base64')).not.toThrow()
    expect(() => Buffer.from(result.iv, 'base64')).not.toThrow()
    expect(() => Buffer.from(result.authTag, 'base64')).not.toThrow()
  })

  it('decrypt recovers the original plaintext', () => {
    const plaintext = 'super-secret-value'
    const { encryptedValue, iv, authTag } = encrypt(plaintext)
    expect(decrypt(encryptedValue, iv, authTag)).toBe(plaintext)
  })

  it('roundtrip works for an empty string', () => {
    const { encryptedValue, iv, authTag } = encrypt('')
    expect(decrypt(encryptedValue, iv, authTag)).toBe('')
  })

  it('roundtrip works for a string with special characters', () => {
    const special = '!@#$%^&*()_+ 日本語 emoji 🚀'
    const { encryptedValue, iv, authTag } = encrypt(special)
    expect(decrypt(encryptedValue, iv, authTag)).toBe(special)
  })

  it('produces different ciphertext on each call (random IV)', () => {
    const { encryptedValue: c1, iv: iv1 } = encrypt('same')
    const { encryptedValue: c2, iv: iv2 } = encrypt('same')
    // IVs should differ with overwhelming probability
    expect(iv1).not.toBe(iv2)
    expect(c1).not.toBe(c2)
  })

  it('throws when ENCRYPTION_KEY is not set', () => {
    delete process.env['ENCRYPTION_KEY']
    expect(() => encrypt('test')).toThrow(
      'ENCRYPTION_KEY environment variable is not set'
    )
  })

  it('throws when ENCRYPTION_KEY is not 64 hex chars', () => {
    process.env['ENCRYPTION_KEY'] = 'tooshort'
    expect(() => encrypt('test')).toThrow('64-character hex string')
  })

  it('throws on decryption when the auth tag has been tampered with', () => {
    const { encryptedValue, iv } = encrypt('value')
    const badTag = Buffer.alloc(16, 0xff).toString('base64')
    expect(() => decrypt(encryptedValue, iv, badTag)).toThrow()
  })

  it('throws on decryption when the ciphertext has been tampered with', () => {
    const { iv, authTag } = encrypt('value')
    const badCipher = Buffer.alloc(16, 0xab).toString('base64')
    expect(() => decrypt(badCipher, iv, authTag)).toThrow()
  })
})
