// ./app/api/dashboard/activity/all/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/jwt'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'
    const userId = decoded.userId;

    const activities: any[] = [];

    // Get calls if filter allows
    if (filter === 'all' || filter === 'calls') {
      const { data: calls } = await supabase
        .from('calls')
        .select('*')
        .eq('user_id', userId)
        .order('date_created', { ascending: false })
        .limit(50);

      (calls || []).forEach(call => {
        activities.push({
          id: `call-${call.id}`,
          type: 'call',
          title: `${call.direction === 'outbound' ? 'Outbound Call' : 'Inbound Call'}`,
          description: `${call.direction === 'outbound' ? 'Called' : 'Call from'} ${
            call.direction === 'outbound' ? call.to_number : call.from_number
          }`,
          phone_number: call.direction === 'outbound' ? call.to_number : call.from_number,
          time: formatTimeAgo(call.date_created),
          status: call.status,
          created_at: call.date_created,
          duration: call.duration || 0,
          cost: parseFloat(call.price || '0'),
        });
      });
    }

    // Get messages if filter allows
    if (filter === 'all' || filter === 'sms') {
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .order('date_created', { ascending: false })
        .limit(50);

      (messages || []).forEach(message => {
        activities.push({
          id: `sms-${message.id}`,
          type: 'sms',
          title: `${message.direction === 'outbound' ? 'Outbound SMS' : 'Inbound SMS'}`,
          description: `${message.direction === 'outbound' ? 'Sent to' : 'Received from'} ${
            message.direction === 'outbound' ? message.to_number : message.from_number
          }`,
          phone_number: message.direction === 'outbound' ? message.to_number : message.from_number,
          time: formatTimeAgo(message.date_created),
          status: message.direction === 'outbound' ? message.status : 'received',
          created_at: message.date_created,
        });
      });
    }

    // Sort by date
    activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json(activities)

  } catch (error) {
    console.error('Activity fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
}