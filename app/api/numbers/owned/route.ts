// ./app/api/numbers/owned/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    if (!token) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { data: numbers, error } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('user_id', decoded.userId)
      .order('date_created', { ascending: false });

    if (error) {
      console.error('Error fetching owned numbers:', error);
      return NextResponse.json({ error: 'Failed to fetch numbers' }, { status: 500 });
    }

    return NextResponse.json({
      numbers: numbers.map(num => ({
        sid: num.sid,
        phoneNumber: num.phone_number,
        capabilities: num.capabilities,
        status: num.status,
        dateCreated: num.date_created,
        voiceUrl: num.voice_url,
        smsUrl: num.sms_url,
      }))
    });

  } catch (error) {
    console.error('Error in owned numbers API:', error);
    return NextResponse.json({ error: 'Failed to fetch numbers' }, { status: 500 });
  }
}