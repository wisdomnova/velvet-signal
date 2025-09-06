// ./app/api/sms/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try { 
    const formData = await request.formData();
    
    const messageSid = formData.get('MessageSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const body = formData.get('Body') as string;
    const messageStatus = formData.get('SmsStatus') as string;
  
    // Find the user who owns the 'to' phone number
    const { data: phoneNumber, error } = await supabase
      .from('phone_numbers')
      .select('user_id')
      .eq('phone_number', to)
      .single();

    if (error || !phoneNumber) {
      console.error('Received SMS for unknown phone number:', to);
      return NextResponse.json({ error: 'Phone number not found' }, { status: 404 });
    }

    // Save incoming message to database
    const { error: insertError } = await supabase
      .from('messages')
      .insert({
        sid: messageSid,
        from_number: from,
        to_number: to,
        body,
        direction: 'inbound',
        status: messageStatus || 'received',
        user_id: phoneNumber.user_id,
        date_created: new Date().toISOString(),
        is_read: false,
      });

    if (insertError) {
      console.error('Error saving incoming message:', insertError);
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
    }

    // Respond to Twilio (empty response means success)
    return new NextResponse('', { status: 200 });

  } catch (error) {
    console.error('Error in SMS webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}