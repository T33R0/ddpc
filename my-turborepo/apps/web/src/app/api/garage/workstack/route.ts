import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPlanForUser } from '@/lib/plan-utils';
import type { DashboardWorkItem, Tier } from '@repo/types';

function getWorkstackForTier(tier: Tier, userId: string): DashboardWorkItem[] {
  switch (tier) {
    case 'T0':
      return [
        {
          id: 't0-quick-add',
          kind: 'historical',
          title: 'Log a Past Event',
          subtitle: 'Add maintenance or modification history',
          actions: [{ label: 'Log Event', op: 'open' }]
        }
      ];

    case 'T1':
      return [
        {
          id: 't1-schedule',
          kind: 'maintenance',
          title: 'Add Maintenance Schedule',
          subtitle: 'Set up recurring maintenance tasks',
          actions: [{ label: 'Create Schedule', op: 'open' }]
        }
      ];

    case 'T2':
      return [
        {
          id: 't2-build-plan',
          kind: 'build',
          title: 'Design Your Build Plan',
          subtitle: 'Plan and track your vehicle modifications',
          actions: [{ label: 'Start Planning', op: 'open' }]
        }
      ];

    case 'T3':
      return [
        {
          id: 't3-automation',
          kind: 'fleet',
          title: 'Connect Automation (API/Webhooks)',
          subtitle: 'Integrate with external tools and services',
          actions: [{ label: 'Setup Automation', op: 'open' }]
        }
      ];

    default:
      return [];
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

    // Get workstack items based on tier
    const items = getWorkstackForTier(tier, user.id);

    // TODO: In a real implementation, fetch actual work items from database
    // For now, return tier-appropriate items

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching workstack:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
