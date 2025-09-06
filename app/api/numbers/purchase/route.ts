// ./app/api/numbers/purchase/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { createClient } from '@supabase/supabase-js';
import { twilioClient } from '@/lib/twilio';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Environment validation
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Database configuration missing');
      return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 });
    }

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.error('❌ Twilio configuration missing');
      return NextResponse.json({ error: 'Twilio configuration missing' }, { status: 500 });
    }

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    if (!token) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Validate phone number format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json({ 
        error: 'Invalid phone number format. Must be in E.164 format (e.g., +1234567890)' 
      }, { status: 400 });
    }

    // Check if user already owns this number
    const { data: existingNumber } = await supabase
      .from('phone_numbers')
      .select('phone_number')
      .eq('user_id', decoded.userId)
      .eq('phone_number', phoneNumber)
      .single();

    if (existingNumber) {
      return NextResponse.json({ 
        error: 'You already own this phone number' 
      }, { status: 400 });
    }

    // Get the base URL for webhooks with robust fallback
    const baseUrl = (() => {
      if (process.env.NODE_ENV === 'production') {
        return process.env.NEXT_PUBLIC_APP_URL || 
               (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
               'https://velvet-signal.vercel.app';
      }
      return process.env.NGROK_URL || 
             process.env.NEXT_PUBLIC_APP_URL || 
             'http://localhost:3000';
    })();

    console.log('🌐 Using base URL for webhooks:', baseUrl);

    // Purchase number with automatic webhook configuration
    const number = await twilioClient.incomingPhoneNumbers.create({
      phoneNumber,
      voiceUrl: `${baseUrl}/api/voice/webhook`,
      voiceMethod: 'POST',
      smsUrl: `${baseUrl}/api/sms/webhook`,  
      smsMethod: 'POST',
      statusCallback: `${baseUrl}/api/calls/status`,
      statusCallbackMethod: 'POST'
    });

    console.log('✅ Number purchased with webhooks configured:', {
      phoneNumber: number.phoneNumber,
      sid: number.sid,
      voiceUrl: `${baseUrl}/api/voice/webhook`,
      smsUrl: `${baseUrl}/api/sms/webhook`,
      statusCallback: `${baseUrl}/api/calls/status`,
      capabilities: number.capabilities
    });

    // Save to database with comprehensive data
    const { data: savedNumber, error } = await supabase
      .from('phone_numbers')
      .insert({
        sid: number.sid,
        phone_number: number.phoneNumber,
        user_id: decoded.userId,
        friendly_name: number.friendlyName || number.phoneNumber,
        capabilities: {
          voice: number.capabilities.voice,
          sms: number.capabilities.sms,
          mms: number.capabilities.mms,
        },
        status: number.status,
        voice_url: `${baseUrl}/api/voice/webhook`,
        sms_url: `${baseUrl}/api/sms/webhook`,
        status_callback: `${baseUrl}/api/calls/status`,
        date_created: new Date().toISOString(),
        date_updated: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving number to database:', error);
      
      // Try to release the Twilio number if database save failed
      try {
        await twilioClient.incomingPhoneNumbers(number.sid).remove();
        console.log('🗑️ Released Twilio number due to database error');
      } catch (releaseError) {
        console.error('❌ Failed to release Twilio number:', releaseError);
      }
      
      return NextResponse.json({ 
        error: 'Failed to save number to database. Number has been released.' 
      }, { status: 500 });
    }

    console.log('💾 Number saved to database:', {
      sid: savedNumber.sid,
      phoneNumber: savedNumber.phone_number,
      userId: savedNumber.user_id
    });

    return NextResponse.json({
      success: true,
      message: 'Number purchased successfully with automatic webhook configuration',
      number: {
        id: savedNumber.id,
        sid: savedNumber.sid,
        phoneNumber: savedNumber.phone_number,
        friendlyName: savedNumber.friendly_name,
        capabilities: savedNumber.capabilities,
        status: savedNumber.status,
        voiceUrl: savedNumber.voice_url,
        smsUrl: savedNumber.sms_url,
        statusCallback: savedNumber.status_callback,
        dateCreated: savedNumber.date_created,
        dateUpdated: savedNumber.date_updated,
      }
    });

  } catch (error) {
    console.error('❌ Error in purchase number API:', error);
    
    // Check if it's a Twilio-specific error
    if (error && typeof error === 'object' && 'code' in error) {
      const twilioError = error as any;
      
      switch (twilioError.code) {
        case 21452:
          return NextResponse.json({ 
            error: 'Phone number is no longer available. Please search for another number.' 
          }, { status: 400 });
        case 20003:
          return NextResponse.json({ 
            error: 'Authentication failed. Please check your Twilio credentials.' 
          }, { status: 500 });
        case 20404:
          return NextResponse.json({ 
            error: 'Phone number not found. Please search for another number.' 
          }, { status: 400 });
        case 21421:
          return NextResponse.json({ 
            error: 'Invalid phone number format.' 
          }, { status: 400 });
        default:
          return NextResponse.json({ 
            error: `Twilio error: ${twilioError.message || 'Unknown Twilio error'}`,
            code: twilioError.code 
          }, { status: 400 });
      }
    }

    // Handle network/connection errors
    if (error instanceof Error) {
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        return NextResponse.json({ 
          error: 'Network error. Please check your internet connection and try again.' 
        }, { status: 503 });
      }
      
      if (error.message.includes('timeout')) {
        return NextResponse.json({ 
          error: 'Request timeout. Please try again.' 
        }, { status: 408 });
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to purchase number',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please try again or contact support if the problem persists.'
      },
      { status: 500 }
    );
  }
}