import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPlanForUser } from '@repo/services/planUtils';
import type { ActivityItem } from '@repo/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: In a real implementation, fetch actual activity from database
    // For now, return empty array
    const activities: ActivityItem[] = [];

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
