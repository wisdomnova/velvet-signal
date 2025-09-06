// ./app/api/sms/conversations/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
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

    // Get all messages for the user
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', decoded.userId)
      .order('date_created', { ascending: false });

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Group messages by phone number (conversation)
    const conversationsMap = new Map();

    for (const message of messages) {
      const phoneNumber = message.direction === 'outbound' ? message.to_number : message.from_number;
      
      if (!conversationsMap.has(phoneNumber)) {
        conversationsMap.set(phoneNumber, {
          phoneNumber,
          messages: [],
          lastMessage: message.body,
          lastMessageDate: message.date_created,
          unreadCount: 0,
        });
      }

      conversationsMap.get(phoneNumber).messages.push({
        id: message.id,
        from: message.from_number,
        to: message.to_number,
        body: message.body,
        direction: message.direction,
        status: message.status,
        dateCreated: message.date_created,
        sid: message.sid,
      });

      // Count unread messages (inbound messages without read status)
      if (message.direction === 'inbound' && !message.is_read) {
        conversationsMap.get(phoneNumber).unreadCount++;
      }
    }

    const conversations = Array.from(conversationsMap.values()).map(conv => ({
      ...conv,
      messages: conv.messages.reverse(), // Oldest first for display
    }));

    return NextResponse.json({ conversations });

  } catch (error) {
    console.error('Error in conversations API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}