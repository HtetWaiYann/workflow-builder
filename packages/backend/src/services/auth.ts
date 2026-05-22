import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

/** Hashes a plaintext password using bcrypt with 12 salt rounds. */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

/** Returns true if the plaintext password matches the stored bcrypt hash. */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Signs a JWT embedding the user's id (as `sub`) and email.
 * Reads `JWT_SECRET` and `JWT_EXPIRES_IN` (default `7d`) from the environment.
 */
export function signToken(payload: { id: string; email: string }): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set')
  return jwt.sign({ sub: payload.id, email: payload.email }, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN ??
      '7d') as jwt.SignOptions['expiresIn'],
  })
}

/**
 * Verifies a JWT and returns its decoded payload.
 * Throws if the token is expired, malformed, or the secret is missing.
 */
export function verifyToken(token: string): { sub: string; email: string } {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set')
  const decoded = jwt.verify(token, secret)
  if (
    typeof decoded !== 'object' ||
    decoded === null ||
    typeof decoded.sub !== 'string' ||
    typeof decoded.email !== 'string'
  ) {
    throw new Error('Invalid token payload')
  }
  return { sub: decoded.sub, email: decoded.email }
}
