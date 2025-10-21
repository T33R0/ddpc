import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPlanForUser, mapPlanToTier } from '@/lib/plan-utils';
import type { KPI, Tier } from '@repo/types';

function getKPIsForTier(tier: Tier, userId: string): KPI[] {
  const baseKPIs: KPI[] = [];

  switch (tier) {
    case 'T0':
      return [
        { key: 'lastEvent', label: 'Last Event', value: 'Never' },
        { key: 'vehicles', label: 'Vehicles Active', value: '0/2' },
      ];

    case 'T1':
      return [
        { key: 'nextDue', label: 'Next Due', value: 'No schedules' },
        { key: 'overdue', label: 'Overdue', value: '0' },
        { key: 'vehicles', label: 'Vehicles', value: '0/3' },
      ];

    case 'T2':
      return [
        { key: 'stageName', label: 'Current Stage', value: 'Planning' },
        { key: 'stageETA', label: 'Stage ETA', value: 'No builds' },
        { key: 'budgetUsed', label: 'Budget Used', value: '$0' },
        { key: 'compatFlags', label: 'Compatibility Flags', value: '0' },
      ];

    case 'T3':
      return [
        { key: 'activeBuilds', label: 'Active Builds', value: '0' },
        { key: 'spendVsPlan', label: 'Spend vs Plan', value: '$0/$0' },
        { key: 'onTimePct', label: 'On-Time %', value: '100%' },
        { key: 'downtime30d', label: 'Downtime (30d)', value: '0h' },
      ];

    default:
      return baseKPIs;
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user tier
    const tier = await getPlanForUser(user.id);

    // Get KPIs based on tier
    const tiles = getKPIsForTier(tier, user.id);

    // TODO: In a real implementation, fetch actual data from database
    // For now, return mock data

    return NextResponse.json({ tiles });
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
