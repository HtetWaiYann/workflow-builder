import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error('ENCRYPTION_KEY environment variable is not set')
  const buf = Buffer.from(key, 'hex')
  if (buf.length !== 32) {
    throw new Error(
      'ENCRYPTION_KEY must be a 64-character hex string (32 bytes)'
    )
  }
  return buf
}

export interface EncryptedValue {
  encryptedValue: string
  iv: string
  authTag: string
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 *
 * @param plaintext - The value to encrypt.
 * @returns Base64-encoded ciphertext, IV, and auth tag.
 */
export function encrypt(plaintext: string): EncryptedValue {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  return {
    encryptedValue: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  }
}

/**
 * Decrypts an AES-256-GCM encrypted value.
 *
 * @param encryptedValue - Base64-encoded ciphertext.
 * @param iv - Base64-encoded initialization vector.
 * @param authTag - Base64-encoded GCM auth tag.
 * @returns The original plaintext string.
 * @throws If the key is wrong or the ciphertext has been tampered with.
 */
export function decrypt(
  encryptedValue: string,
  iv: string,
  authTag: string
): string {
  const key = getEncryptionKey()
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'base64'))
  decipher.setAuthTag(Buffer.from(authTag, 'base64'))

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64')),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}
