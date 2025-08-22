// ./lib/rbac.ts

import { NextRequest } from 'next/server'
import { verifyToken } from './jwt'

export interface AuthUser {
  userId: string
  email: string
  role: 'user' | 'admin'
}

export function requireAuth(request: NextRequest): AuthUser | null {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
  
  if (!token) return null
  
  const decoded = verifyToken(token)
  if (!decoded) return null
  
  return {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role as 'user' | 'admin'
  }
}

export function requireAdmin(request: NextRequest): AuthUser | null {
  const user = requireAuth(request)
  if (!user || user.role !== 'admin') return null
  return user
}

export function hasRole(user: AuthUser | null, role: 'user' | 'admin'): boolean {
  if (!user) return false
  if (role === 'user') return true // All users have user access
  return user.role === role
}