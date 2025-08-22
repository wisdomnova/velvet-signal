// ./app/api/numbers/purchase/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { purchasePhoneNumber } from '@/lib/twilio';
import { verifyToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phoneNumber, voiceUrl, smsUrl } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 } 
      );
    }

    const number = await purchasePhoneNumber(phoneNumber, voiceUrl, smsUrl);

    return NextResponse.json({ number });
  } catch (error) {
    console.error('Error in purchase number API:', error);
    return NextResponse.json(
      { error: 'Failed to purchase number' },
      { status: 500 }
    );
  }
}