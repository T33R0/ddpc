import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPlanForUser, requireFeature } from '@/lib/plan-utils';
import { validateAndRecordOdometerReading } from '@/lib/odometer-service';
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

    const { vehicleId, odometer } = validation.data;

    // Verify user owns this vehicle
    const { data: vehicle, error: vehicleError } = await supabase
      .from('user_vehicle')
      .select('id')
      .eq('id', vehicleId)
      .eq('owner_id', user.id)
      .single();

    if (vehicleError || !vehicle) {
      return NextResponse.json({ error: 'Vehicle not found or access denied' }, { status: 404 });
    }

    // Record the odometer reading in the log
    const validationResult = await validateAndRecordOdometerReading(
      supabase,
      vehicleId,
      odometer,
      new Date().toISOString()
    );

    if (!validationResult.success) {
      return NextResponse.json({
        error: validationResult.error,
        code: validationResult.code
      }, { status: 400 });
    }

    // Update the vehicle's current odometer value
    const { error: updateError } = await supabase
      .from('user_vehicle')
      .update({ odometer: odometer })
      .eq('id', vehicleId);

    if (updateError) {
      console.error('Error updating vehicle odometer:', updateError);
      // We don't fail the request here because the log entry was successful,
      // but we should probably log it.
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating odometer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
