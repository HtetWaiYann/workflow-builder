import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function signToken(payload: { id: string; email: string }): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set')
  return jwt.sign({ sub: payload.id, email: payload.email }, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN ??
      '7d') as jwt.SignOptions['expiresIn'],
  })
}

export function verifyToken(token: string): { sub: string; email: string } {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set')
  return jwt.verify(token, secret) as { sub: string; email: string }
}
