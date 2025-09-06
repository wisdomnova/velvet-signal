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
    const callerId = formData.get('CallerId') as string;  // Get the selected caller ID

    console.log('🎯 Voice webhook called:', { callSid, from, to, callStatus, callerId });

    // Check if this is a browser-initiated call (outbound from web)
    if (from && from.startsWith('client:user_')) {
      console.log('📱 Browser-initiated call detected');
      
      // Use the CallerId passed from the browser if available
      let selectedCallerId = callerId;
      
      // If no CallerId was passed, fall back to user's first number
      if (!selectedCallerId) {
        const userId = from.replace('client:user_', '');
        
        const { data: userNumbers, error } = await supabase
          .from('phone_numbers')
          .select('phone_number')
          .eq('user_id', userId)
          .eq('capabilities->voice', true)
          .order('date_created', { ascending: false })
          .limit(1);

        if (error || !userNumbers || userNumbers.length === 0) {
          console.error('No voice-capable numbers found for user:', userId, error);
          
          const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Say voice="alice">Sorry, you need to purchase a phone number with voice capabilities to make calls. Please visit your dashboard to purchase a number.</Say>
          </Response>`;

          return new NextResponse(errorTwiml, {
            status: 200,
            headers: { 'Content-Type': 'text/xml' },
          });
        }

        selectedCallerId = userNumbers[0].phone_number;
      }
      
      console.log('📞 Using caller ID:', selectedCallerId);
      
      // For browser calls, 'To' contains the actual phone number to dial
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Dial callerId="${selectedCallerId}" 
              action="/api/voice/dial-status" 
              timeout="30"
              record="true">
          <Number>${to}</Number>
        </Dial>
        <Say voice="alice">The call could not be completed. Please try again.</Say>
      </Response>`;

      return new NextResponse(twiml, {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // For incoming calls to your Twilio number
    const { data: phoneNumber, error } = await supabase
      .from('phone_numbers') 
      .select('user_id')
      .eq('phone_number', to)
      .single();

    if (error || !phoneNumber) {
      console.error('Received call for unknown phone number:', to);
      
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="alice">Sorry, this number is not available.</Say>
      </Response>`;

      return new NextResponse(twiml, {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // Save incoming call to database
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
    }

    // Ring browser first, then voicemail
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
      headers: { 'Content-Type': 'text/xml' },
    });

  } catch (error) {
    console.error('Error in voice webhook:', error);
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Say voice="alice">Sorry, there was an error processing your call.</Say>
    </Response>`;

    return new NextResponse(errorTwiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}