// ./app/api/calls/history/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
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

    // Get calls from database
    const { data: calls, error } = await supabase
      .from('calls')
      .select('*')
      .eq('user_id', decoded.userId)
      .order('date_created', { ascending: false });

    if (error) {
      console.error('Error fetching calls:', error);
      return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 });
    }

    // Format calls for frontend
    const formattedCalls = calls.map(call => ({
      id: call.id,
      sid: call.sid,
      from: call.from_number,
      to: call.to_number,
      direction: call.direction,
      status: call.status,
      duration: call.duration || 0,
      dateCreated: call.date_created,
      price: call.price,
      recordingUrl: call.recording_url,
    }));

    return NextResponse.json({ calls: formattedCalls });

  } catch (error) {
    console.error('Error in calls history API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch call history' },
      { status: 500 }
    );
  }
}