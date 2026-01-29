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

    // Call the RPC function to get actual usage from database
    const { data: usageData, error: usageError } = await supabase
      .rpc('get_my_usage_stats')
      .single();

    if (usageError) {
      console.error('Error fetching usage stats:', usageError);
      // Return 0s in case of error to maintain UI stability
      const usage: UsageStats = {
        vehiclesUsed: 0,
        storageUsedGB: 0,
        aiTokensUsed: 0,
      };
      return NextResponse.json(usage);
    }

    // Cast the result to the expected type
    const stats = usageData as { vehicles_count: number, storage_bytes: number };

    // Calculate usage stats
    const usage: UsageStats = {
      vehiclesUsed: stats.vehicles_count,
      // Convert bytes to GB
      storageUsedGB: stats.storage_bytes / (1024 * 1024 * 1024),
      aiTokensUsed: 0,
    };

    return NextResponse.json(usage);
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
