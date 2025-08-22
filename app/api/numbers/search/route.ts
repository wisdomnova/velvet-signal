// ./app/api/numbers/search/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { searchAvailableNumbers } from '@/lib/twilio';
import { verifyToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get('countryCode') || 'US';
    const areaCode = searchParams.get('areaCode') || undefined;
    const locality = searchParams.get('locality') || undefined;

    const numbers = await searchAvailableNumbers(countryCode, areaCode, locality);

    return NextResponse.json({ numbers });
  } catch (error) {
    console.error('Error in search numbers API:', error);
    return NextResponse.json(
      { error: 'Failed to search numbers' },
      { status: 500 }
    );
  }
}