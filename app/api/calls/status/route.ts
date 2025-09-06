// app/api/calls/status/route.ts
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
    const answeredBy = formData.get('AnsweredBy') as string;

    console.log('📊 Call status update:', { 
      callSid, 
      callStatus, 
      callDuration: callDuration || '0',
      price: price || 'N/A'
    });

    // Prepare update data
    const updateData: any = {  
      status: callStatus,
      date_updated: new Date().toISOString(),
    };

    // Update duration if provided
    if (callDuration && parseInt(callDuration) > 0) {
      updateData.duration = parseInt(callDuration);
      console.log('⏱️ Updating duration to:', callDuration, 'seconds');
    }

    // Update recording URL if provided
    if (recordingUrl) {
      updateData.recording_url = recordingUrl;
      console.log('🎙️ Recording URL added');
    }

    // Update price if provided
    if (price) {
      updateData.price = price;
      console.log('💰 Price added:', price);
    }

    if (answeredBy) {
      updateData.answered_by = answeredBy;
    }

    // Update the call in database
    const { error, data } = await supabase
      .from('calls')
      .update(updateData)
      .eq('sid', callSid)
      .select();

    if (error) {
      console.error('❌ Error updating call status:', error);
      return NextResponse.json({ error: 'Failed to update call' }, { status: 500 });
    }

    if (data && data.length > 0) {
      console.log('✅ Call updated successfully:', {
        sid: callSid,
        status: callStatus,
        duration: updateData.duration || 'N/A'
      });
    } else {
      console.warn('⚠️ No call found with SID:', callSid);
    }

    return new NextResponse('', { status: 200 });

  } catch (error) {
    console.error('❌ Error in call status webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}