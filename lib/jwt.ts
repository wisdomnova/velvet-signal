// ./lib/jwt.ts

import jwt from 'jsonwebtoken'
import { User } from '@/types/database'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// Update interface to include role
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export function signToken(payload: { userId: string; email: string; role: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}