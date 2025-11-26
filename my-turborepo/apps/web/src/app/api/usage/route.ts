import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { UsageStats } from '@repo/types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user tier for limits context
    // const tier = await getPlanForUser(user.id);

    // TODO: In a real implementation, calculate actual usage from database
    // For now, return mock data
    const usage: UsageStats = {
      vehiclesUsed: 0,
      storageUsedGB: 0,
      aiTokensUsed: 0,
    };

    return NextResponse.json(usage);
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
