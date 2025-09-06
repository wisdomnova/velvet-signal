// ./app/api/numbers/[sid]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { releasePhoneNumber } from '@/lib/twilio';
import { verifyToken } from '@/lib/jwt';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sid: string }> }
) { 
  try {
    // Await the params
    const { sid } = await params;
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    if (!token) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // First, remove from database
    const { error: dbError } = await supabase
      .from('phone_numbers')
      .delete()
      .eq('sid', sid)
      .eq('user_id', decoded.userId);

    if (dbError) {
      console.error('Error removing number from database:', dbError);
      return NextResponse.json({ error: 'Failed to remove number from database' }, { status: 500 });
    }

    // Then release from Twilio
    await releasePhoneNumber(sid);

    return NextResponse.json({ message: 'Number released successfully' });
  } catch (error) {
    console.error('Error in release number API:', error);
    return NextResponse.json(
      { error: 'Failed to release number' },
      { status: 500 }
    );
  } 
}