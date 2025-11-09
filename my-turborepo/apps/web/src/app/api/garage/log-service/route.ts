import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateAndRecordOdometerReading } from '@/lib/odometer-service';
import { z } from 'zod';
import { updateServiceInterval } from '@/lib/supabase/maintenance';

const logServiceSchema = z.object({
  vehicleId: z.string(),
  description: z.string().min(1, 'Service description is required'),
  event_date: z.string().min(1, 'Service date is required'),
  service_provider: z.string().optional(),
  odometer: z.string().optional(),
  cost: z.string().optional(),
  notes: z.string().optional(),
  service_interval_id: z.string().optional(),
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
    const validation = logServiceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.issues }, { status: 400 });
    }

    const { vehicleId, description, event_date, service_provider, odometer, cost, notes, service_interval_id } = validation.data;

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

    // Convert and validate numeric fields
    const odometerValue = odometer ? parseFloat(odometer) : null;
    const costValue = cost ? parseFloat(cost) : null;

    if (odometer && (isNaN(odometerValue!) || odometerValue! < 0)) {
      return NextResponse.json({ error: 'Invalid odometer value' }, { status: 400 });
    }

    if (cost && (isNaN(costValue!) || costValue! < 0)) {
      return NextResponse.json({ error: 'Invalid cost value' }, { status: 400 });
    }

    // If odometer value is provided, validate it through the centralized odometer service
    let odometerEntryId = null;
    if (odometerValue !== null) {
      const odometerValidation = await validateAndRecordOdometerReading(
        supabase,
        vehicleId,
        odometerValue,
        event_date
      );

      if (!odometerValidation.success) {
        return NextResponse.json({
          error: odometerValidation.error,
          code: odometerValidation.code
        }, { status: 400 });
      }

      odometerEntryId = odometerValidation.odometerEntryId;
    }

    // Insert service log entry
    const { data: serviceEntry, error: insertError } = await supabase
      .from('maintenance_log')
      .insert({
        user_vehicle_id: vehicleId,
        description,
        event_date,
        service_provider: service_provider || null,
        odometer: odometerValue,
        cost: costValue,
        notes: notes || null,
        service_interval_id: service_interval_id || null,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error logging service:', insertError);
      // If it's an RLS error, provide a more helpful message
      if (insertError.message.includes('violates row level security policy')) {
        return NextResponse.json({
          error: 'Permission denied. Please ensure you own this vehicle and the database is properly configured.'
        }, { status: 403 });
      }
      return NextResponse.json({ error: `Failed to log service: ${insertError.message}` }, { status: 500 });
    }

    // After successfully logging, update the corresponding service interval for the next cycle
    if (service_interval_id) {
      await updateServiceInterval(supabase, service_interval_id, vehicleId, odometerValue, event_date);
    }

    return NextResponse.json({
      success: true,
      serviceEntryId: serviceEntry.id,
      message: 'Service logged successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in log-service API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
