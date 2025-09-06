// ./app/api/voice/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData(); 
    
    const callSid = formData.get('CallSid') as string; 
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const callStatus = formData.get('CallStatus') as string;

    console.log('🎯 Voice webhook called:', { callSid, from, to, callStatus });

    // Find the user who owns the 'to' phone number
    const { data: phoneNumber, error } = await supabase
      .from('phone_numbers') 
      .select('user_id')
      .eq('phone_number', to)
      .single();

    if (error || !phoneNumber) {
      console.error('Received call for unknown phone number:', to);
      return NextResponse.json({ error: 'Phone number not found' }, { status: 404 });
    }

    // Save incoming call to database (this will trigger real-time notification)
    const { error: insertError } = await supabase
      .from('calls')
      .insert({
        sid: callSid,
        from_number: from,
        to_number: to,
        direction: 'inbound',
        status: callStatus,
        user_id: phoneNumber.user_id,
        date_created: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error saving incoming call:', insertError);
    } else {
      console.log('✅ Incoming call saved - Real-time notification should fire!');
    }

    // TwiML response - choice between browser calling or voicemail
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Dial timeout="20" action="/api/voice/dial-status">
        <Client>user_${phoneNumber.user_id}</Client>
      </Dial>
      <Say voice="alice">Sorry, the person you're calling is not available. Please leave a message after the tone.</Say>
      <Record action="/api/voice/recording" timeout="30" playBeep="true" />
      <Say voice="alice">Thank you for your message. Goodbye.</Say>
    </Response>`;

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    });

  } catch (error) {
    console.error('Error in voice webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
} 