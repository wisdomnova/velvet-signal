// ./app/api/sms/send/route.ts

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

    const { to, body, from } = await request.json();

    if (!to || !body) {
      return NextResponse.json({ error: 'To and body are required' }, { status: 400 });
    }

    // Get user's phone numbers to use as 'from' number
    let fromNumber = from;
    if (!fromNumber) {
      const { data: userNumbers, error } = await supabase
        .from('phone_numbers')
        .select('phone_number')
        .eq('user_id', decoded.userId)
        .limit(1)
        .single();
      
      if (error || !userNumbers) {
        return NextResponse.json({ error: 'No phone number available to send from' }, { status: 400 });
      }
      
      fromNumber = userNumbers.phone_number;
    }

    // Send SMS via Twilio
    const message = await twilioClient.messages.create({
      body,
      from: fromNumber,
      to,
    });

    // Save message to database
    const { data: savedMessage, error: saveError } = await supabase
      .from('messages')
      .insert({
        sid: message.sid,
        from_number: fromNumber,
        to_number: to,
        body,
        direction: 'outbound',
        status: message.status,
        user_id: decoded.userId,
        date_created: new Date().toISOString(),
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving message:', saveError);
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
    }

    return NextResponse.json({
      message: {
        id: savedMessage.id,
        sid: savedMessage.sid,
        from: savedMessage.from_number,
        to: savedMessage.to_number,
        body: savedMessage.body,
        direction: savedMessage.direction,
        status: savedMessage.status,
        dateCreated: savedMessage.date_created,
      }
    });

  } catch (error) {
    console.error('Error in send SMS API:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}