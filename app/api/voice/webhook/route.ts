// // app/api/voice/webhook/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { createClient } from '@supabase/supabase-js';

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );

// export async function POST(request: NextRequest) {
//   try {
//     const formData = await request.formData(); 
    
//     const callSid = formData.get('CallSid') as string; 
//     const from = formData.get('From') as string;
//     const to = formData.get('To') as string;
//     const callStatus = formData.get('CallStatus') as string;
//     const callerId = formData.get('CallerId') as string;

//     console.log('🎯 Voice webhook called:', { callSid, from, to, callStatus, callerId });

//     // Check if this is a browser-initiated call (outbound from web)
//     if (from && from.startsWith('client:user_')) {
//       console.log('📱 Browser-initiated call detected');
      
//       const userId = from.replace('client:user_', '');
      
//       // Save the outbound call to database immediately
//       const { error: insertError } = await supabase
//         .from('calls')
//         .insert({
//           sid: callSid,
//           from_number: callerId || 'unknown',
//           to_number: to,
//           direction: 'outbound',
//           status: callStatus || 'initiated',
//           user_id: userId,
//           date_created: new Date().toISOString(),
//         });

//       if (insertError) {
//         console.error('Error saving outbound call:', insertError);
//       }
      
//       let selectedCallerId = callerId;
      
//       if (!selectedCallerId) {
//         const { data: userNumbers, error } = await supabase
//           .from('phone_numbers')
//           .select('phone_number')
//           .eq('user_id', userId)
//           .eq('capabilities->voice', true)
//           .order('date_created', { ascending: false })
//           .limit(1);

//         if (error || !userNumbers || userNumbers.length === 0) {
//           console.error('No voice-capable numbers found for user:', userId, error);
          
//           const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
//           <Response>
//             <Say voice="alice">Sorry, you need to purchase a phone number with voice capabilities to make calls.</Say>
//           </Response>`;

//           return new NextResponse(errorTwiml, {
//             status: 200,
//             headers: { 'Content-Type': 'text/xml' },
//           });
//         }

//         selectedCallerId = userNumbers[0].phone_number;
        
//         await supabase
//           .from('calls')
//           .update({ from_number: selectedCallerId })
//           .eq('sid', callSid);
//       }
      
//       console.log('📞 Using caller ID:', selectedCallerId);
      
//       const twiml = `<?xml version="1.0" encoding="UTF-8"?>
//       <Response>
//         <Dial callerId="${selectedCallerId}" 
//               action="/api/calls/status" 
//               timeout="30"
//               record="true">
//           <Number>${to}</Number>
//         </Dial>
//         <Say voice="alice">The call could not be completed. Please try again.</Say>
//       </Response>`;

//       return new NextResponse(twiml, {
//         status: 200,
//         headers: { 'Content-Type': 'text/xml' },
//       });
//     }

//     // For incoming calls to your Twilio number
//     console.log('📞 Incoming call detected - From:', from, 'To:', to);
    
//     const { data: phoneNumber, error } = await supabase
//       .from('phone_numbers') 
//       .select('user_id, phone_number')
//       .eq('phone_number', to)
//       .single();

//     if (error || !phoneNumber) {
//       console.error('❌ No user found for phone number:', to, 'Error:', error);
      
//       // List all numbers in database for debugging
//       const { data: allNumbers } = await supabase
//         .from('phone_numbers')
//         .select('phone_number, user_id');
      
//       console.log('📋 Available numbers in database:', allNumbers);
      
//       const twiml = `<?xml version="1.0" encoding="UTF-8"?>
//       <Response>
//         <Say voice="alice">Sorry, this number is not available. The call could not be completed.</Say>
//       </Response>`;

//       return new NextResponse(twiml, {
//         status: 200,
//         headers: { 'Content-Type': 'text/xml' },
//       });
//     }

//     console.log('✅ Found user for incoming call:', phoneNumber.user_id);

//     // Save incoming call to database
//     const { error: insertError } = await supabase
//       .from('calls')
//       .insert({
//         sid: callSid,
//         from_number: from,
//         to_number: to,
//         direction: 'inbound',
//         status: callStatus || 'ringing',
//         user_id: phoneNumber.user_id,
//         date_created: new Date().toISOString(),
//       });

//     if (insertError) {
//       console.error('Error saving incoming call:', insertError);
//     } else {
//       console.log('✅ Incoming call saved to database');
//     }

//     // Ring browser client for 20 seconds, then voicemail
//     const twiml = `<?xml version="1.0" encoding="UTF-8"?>
//     <Response>
//       <Dial timeout="20" action="/api/calls/status">
//         <Client>user_${phoneNumber.user_id}</Client>
//       </Dial>
//       <Say voice="alice">Sorry, the person you're calling is not available. Please leave a message after the tone.</Say>
//       <Record action="/api/voice/recording" timeout="30" playBeep="true" />
//       <Say voice="alice">Thank you for your message. Goodbye.</Say>
//     </Response>`;

//     console.log('📋 Returning TwiML to ring browser client: user_' + phoneNumber.user_id);
//     return new NextResponse(twiml, {
//       status: 200,
//       headers: { 'Content-Type': 'text/xml' },
//     });

//   } catch (error) {
//     console.error('❌ Error in voice webhook:', error);
    
//     const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
//     <Response>
//       <Say voice="alice">Sorry, there was an error processing your call. Please try again later.</Say>
//     </Response>`;

//     return new NextResponse(errorTwiml, {
//       status: 200,
//       headers: { 'Content-Type': 'text/xml' },
//     });
//   }
// } 





// app/api/voice/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  console.log('🚀 Voice webhook called - Starting processing...');
  
  try {
    // Log environment check
    console.log('🔧 Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV
    });

    const formData = await request.formData(); 
    
    const callSid = formData.get('CallSid') as string; 
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const callStatus = formData.get('CallStatus') as string;
    const callerId = formData.get('CallerId') as string;

    console.log('📞 Webhook parameters received:', { 
      callSid, 
      from, 
      to, 
      callStatus, 
      callerId,
      allParams: Object.fromEntries(formData.entries())
    });

    // Validate required parameters
    if (!callSid || !from || !to) {
      console.error('❌ Missing required parameters:', { callSid, from, to });
      
      const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="alice">Invalid call parameters received.</Say>
      </Response>`;

      return new NextResponse(errorTwiml, {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // SCENARIO 1: Browser-initiated call (outbound from TwiML App)
    if (from && from.startsWith('client:user_')) {
      console.log('📱 Browser-initiated call detected (via TwiML App)');
      
      const userId = from.replace('client:user_', '');
      console.log('👤 Extracted user ID:', userId);
      
      // Get the caller ID from the request or user's first number
      let selectedCallerId = callerId;
      console.log('🆔 Initial caller ID:', selectedCallerId);
      
      if (!selectedCallerId) {
        console.log('🔍 No caller ID provided, looking up user numbers...');
        
        try {
          const { data: userNumbers, error } = await supabase
            .from('phone_numbers')
            .select('phone_number')
            .eq('user_id', userId)
            .eq('capabilities->voice', true)
            .order('date_created', { ascending: false })
            .limit(1);

          console.log('📋 User numbers query result:', { 
            userNumbers: userNumbers?.length || 0, 
            error: error?.message,
            numbers: userNumbers?.map(n => n.phone_number)
          });

          if (error) {
            console.error('❌ Database error fetching user numbers:', error);
            throw new Error(`Database error: ${error.message}`);
          }

          if (!userNumbers || userNumbers.length === 0) {
            console.error('❌ No voice-capable numbers found for user:', userId);
            
            const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
            <Response>
              <Say voice="alice">Sorry, you need to purchase a phone number with voice capabilities to make calls.</Say>
            </Response>`;

            return new NextResponse(errorTwiml, {
              status: 200,
              headers: { 'Content-Type': 'text/xml' },
            });
          }

          selectedCallerId = userNumbers[0].phone_number;
          console.log('✅ Selected caller ID from database:', selectedCallerId);
        } catch (dbError) {
          console.error('❌ Error querying user numbers:', dbError);
          throw dbError;
        }
      }
      
      // Save the outbound call to database
      console.log('💾 Saving outbound call to database...');
      try {
        const { error: insertError } = await supabase
          .from('calls')
          .insert({
            sid: callSid,
            from_number: selectedCallerId,
            to_number: to,
            direction: 'outbound',
            status: callStatus || 'initiated',
            user_id: userId,
            date_created: new Date().toISOString(),
          });

        if (insertError) {
          console.error('❌ Error saving outbound call:', insertError);
          // Don't throw - continue with call even if DB save fails
        } else {
          console.log('✅ Outbound call saved to database');
        }
      } catch (saveError) {
        console.error('❌ Exception saving outbound call:', saveError);
        // Don't throw - continue with call
      }
      
      console.log('📞 Using caller ID for outbound call:', selectedCallerId);
      
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Dial callerId="${selectedCallerId}" 
              action="/api/calls/status" 
              timeout="30"
              record="true">
          <Number>${to}</Number>
        </Dial>
        <Say voice="alice">The call could not be completed. Please try again.</Say>
      </Response>`;

      console.log('📋 Returning TwiML for outbound call');
      return new NextResponse(twiml, {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // SCENARIO 2: Incoming call to purchased number (direct webhook)
    console.log('📞 Processing incoming call to purchased number:', to);
    
    try {
      const { data: phoneNumber, error } = await supabase
        .from('phone_numbers') 
        .select('user_id, phone_number')
        .eq('phone_number', to)
        .single();

      console.log('🔍 Phone number lookup result:', { 
        found: !!phoneNumber, 
        error: error?.message,
        phoneNumber: phoneNumber?.phone_number,
        userId: phoneNumber?.user_id
      });

      if (error) {
        console.error('❌ Database error looking up phone number:', error);
        
        // Try to get all numbers for debugging
        try {
          const { data: allNumbers } = await supabase
            .from('phone_numbers')
            .select('phone_number, user_id');
          
          console.log('📋 All numbers in database for debugging:', 
            allNumbers?.map(n => ({ phone: n.phone_number, user: n.user_id }))
          );
        } catch (debugError) {
          console.error('❌ Error fetching all numbers for debug:', debugError);
        }
      }

      if (error || !phoneNumber) {
        console.error('❌ No user found for phone number:', to);
        
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="alice">Sorry, this number is not available.</Say>
        </Response>`;

        return new NextResponse(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        });
      }

      console.log('✅ Found user for incoming call:', phoneNumber.user_id);

      // Save incoming call to database
      console.log('💾 Saving incoming call to database...');
      try {
        const { error: insertError } = await supabase
          .from('calls')
          .insert({
            sid: callSid,
            from_number: from,
            to_number: to,
            direction: 'inbound',
            status: callStatus || 'ringing',
            user_id: phoneNumber.user_id,
            date_created: new Date().toISOString(),
          });

        if (insertError) {
          console.error('❌ Error saving incoming call:', insertError);
          // Don't throw - continue with call
        } else {
          console.log('✅ Incoming call saved to database');
        }
      } catch (saveError) {
        console.error('❌ Exception saving incoming call:', saveError);
        // Don't throw - continue with call
      }

      // Ring browser client for the user who owns this number
      const clientIdentity = `user_${phoneNumber.user_id}`;
      console.log('🔔 Ringing browser client:', clientIdentity);
      
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Dial timeout="20" action="/api/calls/status">
          <Client>${clientIdentity}</Client>
        </Dial>
        <Say voice="alice">Sorry, the person you're calling is not available. Please leave a message after the tone.</Say>
        <Record action="/api/voice/recording" timeout="30" playBeep="true" />
        <Say voice="alice">Thank you for your message. Goodbye.</Say>
      </Response>`;

      console.log('📋 Returning TwiML to ring browser for:', clientIdentity);
      return new NextResponse(twiml, {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });

    } catch (lookupError) {
      console.error('❌ Exception during phone number lookup:', lookupError);
      throw lookupError;
    }

  } catch (error) {
    console.error('❌ FATAL ERROR in voice webhook:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : 'No stack',
      type: typeof error,
      errorObj: error
    });
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Say voice="alice">Sorry, there was an error processing your call. Please try again later.</Say>
    </Response>`;

    return new NextResponse(errorTwiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}