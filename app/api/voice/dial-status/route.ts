// ./app/api/voice/dial-status/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const dialCallStatus = formData.get('DialCallStatus') as string;
    const callSid = formData.get('CallSid') as string;
    
    console.log('📞 Dial status:', { callSid, dialCallStatus });

    // Handle different dial outcomes
    if (dialCallStatus === 'no-answer' || dialCallStatus === 'busy') {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="alice">The person you're calling is not available. Please try again later.</Say>
      </Response>`;
      
      return new NextResponse(twiml, {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // For successful calls, end normally
    return new NextResponse('', { status: 200 });

  } catch (error) {
    console.error('Error in dial status webhook:', error);
    return new NextResponse('', { status: 200 });
  }
}