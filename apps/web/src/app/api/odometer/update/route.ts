import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateAndRecordOdometerReading } from '@/lib/odometer-service';
import { z } from 'zod';

const odometerUpdateSchema = z.object({
  vehicleId: z.string(),
  newMileageValue: z.number().min(0),
  newEventDate: z.string(), // ISO date string
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const validation = odometerUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.issues }, { status: 400 });
    }

    const { vehicleId, newMileageValue, newEventDate } = validation.data;

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

    // Use the centralized odometer validation service
    const validationResult = await validateAndRecordOdometerReading(
      supabase,
      vehicleId,
      newMileageValue,
      newEventDate
    );

    if (!validationResult.success) {
      return NextResponse.json({
        error: validationResult.error,
        code: validationResult.code
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      odometerEntryId: validationResult.odometerEntryId,
      message: 'Odometer reading validated and recorded successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in odometer update service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
