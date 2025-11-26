import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPlanForUser, requireFeature } from '@/lib/plan-utils';
import { z } from 'zod';
import type { UpgradeRequiredError } from '@repo/types';

const updateOdometerSchema = z.object({
  vehicleId: z.string(),
  odometer: z.number().min(0),
});

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user tier
    const tier = await getPlanForUser(user.id);

    // Check if user has maintenance scheduling feature (T1+)
    if (!requireFeature(tier, 'maintenance_scheduling')) {
      const error: UpgradeRequiredError = {
        code: 'UPGRADE_REQUIRED',
        targetTier: 'T1',
        message: 'Odometer updates require a paid plan'
      };
      return NextResponse.json(error, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const validation = updateOdometerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // const { vehicleId, odometer } = validation.data;

    // TODO: In a real implementation, update vehicle odometer in database
    // For now, return success

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating odometer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
