// ./app/api/voice/token/route.ts

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

    if (!process.env.TWILIO_API_KEY || !process.env.TWILIO_API_SECRET) {
      return NextResponse.json({ error: 'Twilio API credentials not configured' }, { status: 500 });
    }

    const identity = `user_${decoded.userId}`;

    const accessToken = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_API_KEY!,
      process.env.TWILIO_API_SECRET!,
      { identity }
    );

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
      incomingAllow: true,
    });

    accessToken.addGrant(voiceGrant);

    return NextResponse.json({
      token: accessToken.toJwt(),
      identity 
    });

  } catch (error) {
    console.error('Error generating voice token:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}