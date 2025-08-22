 // ./app/api/admin/users/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/rbac'
import { supabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const admin = requireAdmin(request)
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const { data: users, error } = await supabaseServer
      .from('users')
      .select('id, email, first_name, last_name, role, is_active, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// Update user role (admin only)
export async function PATCH(request: NextRequest) {
  const admin = requireAdmin(request)
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const { userId, role, isActive } = await request.json()

    const updateData: any = {}
    if (role) updateData.role = role
    if (typeof isActive === 'boolean') updateData.is_active = isActive

    const { data, error } = await supabaseServer
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ user: data })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}