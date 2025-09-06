// app/api/voice/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🎯 WEBHOOK CALLED! Request received');
  
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());
    
    console.log('📞 Webhook data:', data);
    
    // Super simple response - just say hello
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Say voice="alice">Hello! Your webhook is working. This call is from ${data.From || 'unknown'} to ${data.To || 'unknown'}.</Say>
    </Response>`;

    console.log('📋 Returning TwiML response');
    
    return new NextResponse(twiml, {
      status: 200,
      headers: { 
        'Content-Type': 'text/xml',
        'Cache-Control': 'no-cache'
      },
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Say voice="alice">Webhook error occurred.</Say>
    </Response>`;

    return new NextResponse(errorTwiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}