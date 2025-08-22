// ./app/api/numbers/owned/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getOwnedNumbers } from '@/lib/twilio';
import { verifyToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const numbers = await getOwnedNumbers();

    return NextResponse.json({ numbers });
  } catch (error) {
    console.error('Error in owned numbers API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch owned numbers' },
      { status: 500 }
    );
  }
} 