// app/api/sms/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { twilioClient } from '@/lib/twilio';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
 
export async function POST(request: NextRequest) {
  console.log('📤 SMS Send API called');
  
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    if (!token) {
      console.error('❌ No authorization token');
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const decoded = verifyToken(token); 
    if (!decoded) {
      console.error('❌ Invalid token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('✅ User authenticated:', decoded.userId);

    const { to, body, from } = await request.json();

    console.log('📋 SMS request data:', { to, body, from: from || 'not specified' });

    if (!to || !body) {
      console.error('❌ Missing required fields:', { to: !!to, body: !!body });
      return NextResponse.json({ error: 'To and body are required' }, { status: 400 });
    }

    // ✅ FIXED: Use the 'from' number from request, with fallback
    let fromNumber = from;

    if (!fromNumber) {
      console.log('🔍 No from number specified, looking up user default...');
      
      const { data: userNumbers, error } = await supabase
        .from('phone_numbers')
        .select('phone_number, capabilities')
        .eq('user_id', decoded.userId)
        .eq('capabilities->sms', true)  // ✅ Only SMS-capable numbers
        .order('date_created', { ascending: false })
        .limit(1)
        .single();
      
      if (error || !userNumbers) {
        console.error('❌ No SMS-capable numbers found:', error);
        return NextResponse.json({ 
          error: 'No SMS-capable phone number available. Please purchase a phone number with SMS capabilities first.' 
        }, { status: 400 });
      }
      
      fromNumber = userNumbers.phone_number;
      console.log('📞 Using default number:', fromNumber);
    } else {
      console.log('📞 Using specified from number:', fromNumber);
    }

    // ✅ ENHANCED: Validate that the from number belongs to the user and has SMS capability
    const { data: numberOwnership, error: ownershipError } = await supabase
      .from('phone_numbers')
      .select('phone_number, capabilities')
      .eq('user_id', decoded.userId)
      .eq('phone_number', fromNumber) 
      .single();

    if (ownershipError || !numberOwnership) {
      console.error('❌ Number ownership validation failed:', ownershipError);
      return NextResponse.json({ 
        error: 'You can only send SMS from phone numbers you own.' 
      }, { status: 403 });
    }

    if (!numberOwnership.capabilities?.sms) {
      console.error('❌ Number does not have SMS capability:', fromNumber);
      return NextResponse.json({ 
        error: 'This phone number does not have SMS capabilities.' 
      }, { status: 403 });
    }

    console.log('✅ Number ownership and SMS capability verified');

    // ✅ ENHANCED: Send SMS via Twilio with detailed logging
    console.log('📤 Sending SMS via Twilio...', { from: fromNumber, to, bodyLength: body.length });
    
    const message = await twilioClient.messages.create({
      body,
      from: fromNumber,
      to,
    });

    console.log('✅ Twilio SMS sent successfully:', {
      sid: message.sid,
      status: message.status,
      from: message.from,
      to: message.to
    });

    // ✅ ENHANCED: Save message to database with better error handling
    console.log('💾 Saving message to database...');
    
    const { data: savedMessage, error: saveError } = await supabase
      .from('messages')
      .insert({
        sid: message.sid,
        from_number: fromNumber,
        to_number: to,
        body,
        direction: 'outbound',
        status: message.status,
        user_id: decoded.userId,
        date_created: new Date().toISOString(),
        is_read: true, // Outbound messages are considered "read"
      })
      .select()
      .single();

    if (saveError) {
      console.error('❌ Error saving message to database:', saveError);
      // Don't fail the request if SMS was sent successfully
      console.warn('⚠️ SMS sent but failed to save to database');
    } else {
      console.log('✅ Message saved to database successfully');
    }

    const responseData = {
      success: true,
      message: {
        id: savedMessage?.id || 'unknown',
        sid: message.sid,
        from: fromNumber,
        to: to,
        body: body,
        direction: 'outbound',
        status: message.status,
        dateCreated: savedMessage?.date_created || new Date().toISOString(),
      },
      twilioResponse: {
        sid: message.sid,
        status: message.status,
        price: message.price,
        priceUnit: message.priceUnit
      }
    };

    console.log('🎉 SMS send operation completed successfully');
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ FATAL ERROR in send SMS API:', error);
    
    // ✅ ENHANCED: Better Twilio error handling
    if (error && typeof error === 'object' && 'code' in error) {
      const twilioError = error as any;
      
      console.error('🚨 Twilio SMS Error:', {
        code: twilioError.code,
        message: twilioError.message,
        status: twilioError.status,
        moreInfo: twilioError.moreInfo
      });
      
      switch (twilioError.code) {
        case 21211:
          return NextResponse.json({ 
            error: 'Invalid phone number format. Please use E.164 format (e.g., +1234567890).',
            code: twilioError.code
          }, { status: 400 });
        case 21612:
          return NextResponse.json({ 
            error: 'The phone number cannot receive SMS messages.',
            code: twilioError.code
          }, { status: 400 });
        case 21614:
          return NextResponse.json({ 
            error: 'This phone number is not a valid mobile number.',
            code: twilioError.code
          }, { status: 400 });
        case 21408:
          return NextResponse.json({ 
            error: 'You do not have permission to send SMS from this number.',
            code: twilioError.code
          }, { status: 403 });
        default:
          return NextResponse.json({ 
            error: `SMS delivery failed: ${twilioError.message}`,
            code: twilioError.code
          }, { status: 400 });
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to send message',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}