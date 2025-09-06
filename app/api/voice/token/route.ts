// // ./app/api/voice/token/route.ts

// import { NextRequest, NextResponse } from 'next/server';
// import { verifyToken } from '@/lib/jwt';
// import twilio from 'twilio';
 
// const AccessToken = twilio.jwt.AccessToken;
// const VoiceGrant = AccessToken.VoiceGrant;

// export async function POST(request: NextRequest) {
//   try {
//     const authHeader = request.headers.get('authorization');
//     const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
//     if (!token) {
//       return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
//     }

//     const decoded = verifyToken(token); 
//     if (!decoded) {
//       return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
//     }

//     // Enhanced environment variable validation
//     if (!process.env.TWILIO_API_KEY || !process.env.TWILIO_API_SECRET || !process.env.TWILIO_TWIML_APP_SID) {
//       console.error('Missing Twilio Voice SDK environment variables:', {
//         hasApiKey: !!process.env.TWILIO_API_KEY,
//         hasApiSecret: !!process.env.TWILIO_API_SECRET,
//         hasTwimlAppSid: !!process.env.TWILIO_TWIML_APP_SID
//       });
//       return NextResponse.json({ 
//         error: 'Twilio Voice SDK not configured. Missing API key, secret, or TwiML App SID' 
//       }, { status: 500 });
//     }

//     const identity = `user_${decoded.userId}`;

//     console.log('🎯 Generating voice token for:', identity);

//     const accessToken = new AccessToken(
//       process.env.TWILIO_ACCOUNT_SID!,
//       process.env.TWILIO_API_KEY!,
//       process.env.TWILIO_API_SECRET!,
//       { identity }
//     );

//     const voiceGrant = new VoiceGrant({
//       outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
//       incomingAllow: true,
//     });

//     accessToken.addGrant(voiceGrant);

//     console.log('✅ Voice token generated successfully for:', identity);

//     return NextResponse.json({
//       token: accessToken.toJwt(),
//       identity 
//     });

//   } catch (error) {
//     console.error('Error generating voice token:', error);
//     return NextResponse.json({ 
//       error: 'Failed to generate token',
//       details: error instanceof Error ? error.message : 'Unknown error'
//     }, { status: 500 });
//   }
// }

// app/api/voice/token/route.ts  
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import twilio from 'twilio';

const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    if (!token) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const authToken = process.env.TWILIO_AUTH_TOKEN!;
    const apiKey = process.env.TWILIO_API_KEY!;
    const apiSecret = process.env.TWILIO_API_SECRET!;

    // Create access token
    const accessToken = new AccessToken(accountSid, apiKey, apiSecret, {
      identity: `user_${decoded.userId}`,
      ttl: 3600
    });

    // Create voice grant WITHOUT TwiML App - use webhook directly
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: undefined, // ❌ Remove TwiML App dependency
      incomingAllow: true // ✅ Allow incoming calls to this identity
    });

    accessToken.addGrant(voiceGrant);

    return NextResponse.json({
      token: accessToken.toJwt(),
      identity: `user_${decoded.userId}`
    });

  } catch (error) {
    console.error('Error generating voice token:', error);
    return NextResponse.json(
      { error: 'Failed to generate voice token' },
      { status: 500 }
    );
  }
}