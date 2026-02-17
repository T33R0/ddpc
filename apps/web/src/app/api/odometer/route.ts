import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateAndRecordOdometerReading } from '@/lib/odometer-service';
import { z } from 'zod';
import { apiSuccess, unauthorized, badRequest, notFound, serverError } from '@/lib/api-utils';

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
      return unauthorized();
    }

    // Parse request body
    const body = await request.json();
    const validation = updateOdometerSchema.safeParse(body);
    if (!validation.success) {
      return badRequest('Invalid request body');
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
      return notFound('Vehicle not found or access denied');
    }

    // Record the odometer reading in the log
    const validationResult = await validateAndRecordOdometerReading(
      supabase,
      vehicleId,
      odometer,
      new Date().toISOString()
    );

    if (!validationResult.success) {
      return badRequest(validationResult.error ?? 'Validation failed');
    }

    // Update the vehicle's current odometer value
    const { error: updateError } = await supabase
      .from('user_vehicle')
      .update({ odometer: odometer })
      .eq('id', vehicleId);

    if (updateError) {
      console.error('Error updating vehicle odometer:', updateError);
    }

    return apiSuccess({ success: true });
  } catch (error) {
    console.error('Error updating odometer:', error);
    return serverError();
  }
}
