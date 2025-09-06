// app/api/numbers/purchase/route.ts
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

    // 🌐 CRITICAL: Get correct webhook base URL
    const baseUrl = (() => {
      if (process.env.NODE_ENV === 'production') {
        // Production: Use explicit production URL first, then fallbacks
        return process.env.NEXT_PUBLIC_APP_URL || 
               (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
               'https://velvet-signal.vercel.app';
      }
      // Development: Use ngrok or localhost
      return process.env.NGROK_URL || 
             process.env.NEXT_PUBLIC_APP_URL || 
             'http://localhost:3000';
    })();

    console.log('🌐 WEBHOOK CONFIGURATION - Using base URL:', baseUrl);
    console.log('🔧 Environment:', process.env.NODE_ENV);
    console.log('📞 Webhook URLs will be:');
    console.log('  - Voice:', `${baseUrl}/api/voice/webhook`);
    console.log('  - SMS:', `${baseUrl}/api/sms/webhook`);
    console.log('  - Status:', `${baseUrl}/api/calls/status`);

    // 🚀 PURCHASE NUMBER WITH AUTOMATIC WEBHOOK CONFIGURATION
    console.log('💳 Purchasing number with automatic webhook setup...');
    
    const number = await twilioClient.incomingPhoneNumbers.create({
      phoneNumber,
      voiceUrl: `${baseUrl}/api/voice/webhook`,         // 📞 INCOMING CALLS webhook
      voiceMethod: 'POST',                              // 📞 HTTP POST method
      smsUrl: `${baseUrl}/api/sms/webhook`,            // 💬 INCOMING SMS webhook  
      smsMethod: 'POST',                               // 💬 HTTP POST method
      statusCallback: `${baseUrl}/api/calls/status`,   // 📊 CALL STATUS updates
      statusCallbackMethod: 'POST'                     // 📊 HTTP POST method
    });

    console.log('✅ ✅ ✅ NUMBER PURCHASED AND CONFIGURED SUCCESSFULLY! ✅ ✅ ✅');
    console.log('📞 Phone Number:', number.phoneNumber);
    console.log('🆔 Twilio SID:', number.sid);
    console.log('🔗 Voice Webhook:', number.voiceUrl);
    console.log('🔗 SMS Webhook:', number.smsUrl);
    console.log('🔗 Status Callback:', number.statusCallback);
    console.log('🎛️ Capabilities:', number.capabilities);
    
    // Verify webhook configuration was applied
    if (number.voiceUrl !== `${baseUrl}/api/voice/webhook`) {
      console.warn('⚠️ WARNING: Voice webhook URL mismatch!');
      console.warn('Expected:', `${baseUrl}/api/voice/webhook`);
      console.warn('Actual:', number.voiceUrl);
    }

    // 💾 SAVE TO DATABASE WITH WEBHOOK TRACKING
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
        voice_url: `${baseUrl}/api/voice/webhook`,      // Store webhook URLs for reference
        sms_url: `${baseUrl}/api/sms/webhook`,
        status_callback: `${baseUrl}/api/calls/status`,
        date_created: new Date().toISOString(),
        date_updated: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ ERROR: Failed to save number to database:', error);
      
      // 🗑️ CLEANUP: Release Twilio number if database save failed
      try {
        console.log('🗑️ Attempting to release Twilio number due to database error...');
        await twilioClient.incomingPhoneNumbers(number.sid).remove();
        console.log('✅ Twilio number released successfully');
      } catch (releaseError) {
        console.error('❌ CRITICAL: Failed to release Twilio number:', releaseError);
        console.error('💰 WARNING: You may be charged for this unreleased number!');
      }
      
      return NextResponse.json({ 
        error: 'Failed to save number to database. Twilio number has been released to prevent charges.' 
      }, { status: 500 });
    }

    console.log('💾 Number saved to database successfully!');
    console.log('🎯 READY FOR INCOMING CALLS!');
    console.log('📱 When someone calls', number.phoneNumber, 'it will:');
    console.log('  1. Hit webhook:', `${baseUrl}/api/voice/webhook`);
    console.log('  2. Look up user in database');
    console.log('  3. Ring browser for user:', decoded.userId);

    // 🎉 SUCCESS RESPONSE
    return NextResponse.json({
      success: true,
      message: 'Phone number purchased and automatically configured for incoming calls!',
      webhookInfo: {
        voiceWebhook: `${baseUrl}/api/voice/webhook`,
        smsWebhook: `${baseUrl}/api/sms/webhook`, 
        statusCallback: `${baseUrl}/api/calls/status`,
        testInstruction: `Call ${number.phoneNumber} from any phone to test incoming calls`
      },
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
    console.error('❌ FATAL ERROR in purchase number API:', error);
    
    // 🔍 ENHANCED TWILIO ERROR HANDLING
    if (error && typeof error === 'object' && 'code' in error) {
      const twilioError = error as any;
      
      console.error('🚨 Twilio API Error:', {
        code: twilioError.code,
        message: twilioError.message,
        moreInfo: twilioError.moreInfo,
        status: twilioError.status
      });
      
      switch (twilioError.code) {
        case 21452:
          return NextResponse.json({ 
            error: 'Phone number is no longer available. Please search for another number.',
            code: twilioError.code
          }, { status: 400 });
        case 20003:
          return NextResponse.json({ 
            error: 'Authentication failed. Please check your Twilio credentials.',
            code: twilioError.code 
          }, { status: 500 });
        case 20404:
          return NextResponse.json({ 
            error: 'Phone number not found. Please search for another number.',
            code: twilioError.code
          }, { status: 400 });
        case 21421:
          return NextResponse.json({ 
            error: 'Invalid phone number format.',
            code: twilioError.code
          }, { status: 400 });
        case 21422:
          return NextResponse.json({ 
            error: 'Invalid webhook URL. Please check your webhook configuration.',
            code: twilioError.code,
            webhookUrl: `${(() => {
              if (process.env.NODE_ENV === 'production') {
                return process.env.NEXT_PUBLIC_APP_URL || 'https://velvet-signal.vercel.app';
              }
              return process.env.NGROK_URL || 'http://localhost:3000';
            })()}/api/voice/webhook`
          }, { status: 400 });
        default:
          return NextResponse.json({ 
            error: `Twilio error: ${twilioError.message || 'Unknown Twilio error'}`,
            code: twilioError.code,
            suggestion: 'Please check your Twilio account status and try again.'
          }, { status: 400 });
      }
    }

    // 🌐 NETWORK ERROR HANDLING
    if (error instanceof Error) {
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        return NextResponse.json({ 
          error: 'Network error connecting to Twilio. Please check your internet connection and try again.',
          details: error.message
        }, { status: 503 });
      }
      
      if (error.message.includes('timeout')) {
        return NextResponse.json({ 
          error: 'Request timeout connecting to Twilio. Please try again.',
          details: error.message
        }, { status: 408 });
      }
    }

    // 🚨 GENERIC ERROR FALLBACK
    return NextResponse.json(
      { 
        error: 'Failed to purchase phone number',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        suggestion: 'Please verify your Twilio credentials and try again. Contact support if the problem persists.',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}