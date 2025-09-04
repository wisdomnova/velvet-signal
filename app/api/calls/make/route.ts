// ./app/api/calls/make/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { twilioClient } from '@/lib/twilio';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {  
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

    const { to, from } = await request.json();

    if (!to) {
      return NextResponse.json({ error: 'To number is required' }, { status: 400 });
    }

    // Hard-coded from number for testing
    let fromNumber = '+17034545469';
    
    // Get user's phone number to use as 'from' number (commented for testing)
    // let fromNumber = from;
    // if (!fromNumber) {
    //   const { data: userNumbers, error } = await supabase
    //     .from('phone_numbers')
    //     .select('phone_number')
    //     .eq('user_id', decoded.userId)
    //     .limit(1)
    //     .single();
    //   
    //   if (error || !userNumbers) {
    //     return NextResponse.json({ error: 'No phone number available to call from' }, { status: 400 });
    //   }
    //   
    //   fromNumber = userNumbers.phone_number;
    // }

    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_APP_URL 
      : process.env.NGROK_URL || process.env.NEXT_PUBLIC_APP_URL;

    // Make call via Twilio
    const call = await twilioClient.calls.create({
      to,
      from: fromNumber,
      url: baseUrl ? `${baseUrl}/api/voice/webhook` : undefined,
      statusCallback: baseUrl ? `${baseUrl}/api/calls/status` : undefined,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      record: true, // Enable call recording
    });

    // Save call to database
    const { data: savedCall, error: saveError } = await supabase
      .from('calls')
      .insert({
        sid: call.sid,
        from_number: fromNumber,
        to_number: to,
        direction: 'outbound',
        status: call.status,
        user_id: decoded.userId,
        date_created: new Date().toISOString(),
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving call:', saveError);
      return NextResponse.json({ error: 'Failed to save call' }, { status: 500 });
    }

    return NextResponse.json({
      call: {
        id: savedCall.id,
        sid: savedCall.sid,
        from: savedCall.from_number,
        to: savedCall.to_number,
        direction: savedCall.direction,
        status: savedCall.status,
        dateCreated: savedCall.date_created,
      }
    });

  } catch (error) {
    console.error('Error in make call API:', error);
    return NextResponse.json(
      { error: 'Failed to make call' },
      { status: 500 }
    );
  }
}