// ./app/api/voice/recording/route.ts

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
    const recordingUrl = formData.get('RecordingUrl') as string;
    const recordingSid = formData.get('RecordingSid') as string;

    // Update call with recording URL
    if (callSid && recordingUrl) {
      await supabase
        .from('calls')
        .update({ recording_url: recordingUrl })
        .eq('sid', callSid);
    }

    // Simple TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Thank you for your message. Goodbye.</Say>
</Response>`;

    return new NextResponse(twiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' }, 
    });
 
  } catch (error) {
    console.error('Error in recording webhook:', error);
    return new NextResponse('', { status: 200 });
  } 
}