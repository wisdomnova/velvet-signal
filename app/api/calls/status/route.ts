// ./app/api/calls/status/route.ts

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
    const callStatus = formData.get('CallStatus') as string;
    const callDuration = formData.get('CallDuration') as string;
    const recordingUrl = formData.get('RecordingUrl') as string;
    const price = formData.get('Price') as string;

    // Update call in database
    const updateData: any = {  
      status: callStatus,
    };

    if (callDuration) {
      updateData.duration = parseInt(callDuration);
    }

    if (recordingUrl) {
      updateData.recording_url = recordingUrl;
    }

    if (price) {
      updateData.price = price;
    }

    const { error } = await supabase
      .from('calls')
      .update(updateData)
      .eq('sid', callSid);

    if (error) {
      console.error('Error updating call status:', error);
      return NextResponse.json({ error: 'Failed to update call' }, { status: 500 });
    }

    // Respond to Twilio (empty response means success)
    return new NextResponse('', { status: 200 });

  } catch (error) {
    console.error('Error in call status webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}