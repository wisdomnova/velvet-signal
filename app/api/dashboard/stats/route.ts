// ./app/api/dashboard/stats/route.ts

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

    const userId = decoded.userId;

    // Get current month and last month dates
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get calls this month
    const { data: callsThisMonth } = await supabase
      .from('calls')
      .select('id, price')
      .eq('user_id', userId)
      .gte('date_created', currentMonthStart.toISOString());

    // Get calls last month
    const { data: callsLastMonth } = await supabase
      .from('calls')
      .select('id')
      .eq('user_id', userId)
      .gte('date_created', lastMonthStart.toISOString())
      .lte('date_created', lastMonthEnd.toISOString());

    // Get SMS this month
    const { data: smsThisMonth } = await supabase
      .from('messages')
      .select('id')
      .eq('user_id', userId)
      .gte('date_created', currentMonthStart.toISOString());

    // Get SMS last month
    const { data: smsLastMonth } = await supabase
      .from('messages')
      .select('id')
      .eq('user_id', userId)
      .gte('date_created', lastMonthStart.toISOString())
      .lte('date_created', lastMonthEnd.toISOString());

    // Get active phone numbers
    const { data: activeNumbers } = await supabase
      .from('phone_numbers')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active');

    // Calculate stats
    const callsCount = (callsThisMonth || []).length;
    const callsLastCount = (callsLastMonth || []).length;
    const smsCount = (smsThisMonth || []).length;
    const smsLastCount = (smsLastMonth || []).length;
    const numbersCount = (activeNumbers || []).length;

    // Calculate total cost
    const totalCost = (callsThisMonth || []).reduce((sum, call) => {
      return sum + (parseFloat(call.price || '0'));
    }, 0);

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number): string => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const change = ((current - previous) / previous * 100);
      return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    const stats = {
      callsThisMonth: callsCount,
      smsThisMonth: smsCount,
      totalCost: totalCost,
      activeNumbers: numbersCount,
      callsChange: calculateChange(callsCount, callsLastCount),
      smsChange: calculateChange(smsCount, smsLastCount),
      costChange: '+0%', // Could calculate based on last month's cost if stored
      numbersChange: '+0%' // Could calculate based on last month's numbers if tracked
    };

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}