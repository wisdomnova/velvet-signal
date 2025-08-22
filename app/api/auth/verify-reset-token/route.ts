// ./app/api/auth/verify-reset-token/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Find user with valid reset token
    const { data: user, error } = await supabaseServer
      .from('users')
      .select('id, reset_token_expiry')
      .eq('reset_token', token)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      )
    }

    // Check if token has expired
    const now = new Date()
    const expiry = new Date(user.reset_token_expiry)

    if (now > expiry) {
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Token is valid'
    })

  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}