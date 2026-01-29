import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateAndRecordOdometerReading } from '@/lib/odometer-service';
import { z } from 'zod';

const addModSchema = z.object({
  vehicleId: z.string(),
  notes: z.string().min(1, 'Modification notes/description is required'),
  mod_item_id: z.string().optional(),
  status: z.enum(['planned', 'ordered', 'installed', 'tuned']),
  cost: z.string().optional(),
  odometer: z.string().optional(),
  event_date: z.string().optional(),
});

interface ModData {
  user_vehicle_id: string;
  notes: string;
  mod_item_id?: string;
  status: string;
  cost?: number;
  odometer?: number;
  event_date?: string;
}

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
    const validation = addModSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.issues }, { status: 400 });
    }

    const { vehicleId, notes, mod_item_id, status, cost, odometer, event_date } = validation.data;

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
    const odometerValue = odometer ? parseInt(odometer) : null;
    const costValue = cost ? parseFloat(cost) : null;

    if (odometer && (isNaN(odometerValue!) || odometerValue! < 0)) {
      return NextResponse.json({ error: 'Invalid odometer value' }, { status: 400 });
    }

    if (cost && (isNaN(costValue!) || costValue! < 0)) {
      return NextResponse.json({ error: 'Invalid cost value' }, { status: 400 });
    }

    // If odometer value is provided, validate it through the centralized odometer service
    if (odometerValue !== null && event_date) {
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

      // odometerEntryId = odometerValidation.odometerEntryId;
    }

    // Insert modification entry
    const modData: ModData = {
      user_vehicle_id: vehicleId,
      notes: notes.trim(),
      status,
    };

    // Add optional fields
    if (mod_item_id) modData.mod_item_id = mod_item_id;
    if (costValue !== null) modData.cost = costValue;
    if (odometerValue !== null) modData.odometer = odometerValue;
    if (event_date) modData.event_date = event_date;

    const { data: modEntry, error: insertError } = await supabase
      .from('mods')
      .insert(modData)
      .select('id')
      .single();

    if (insertError) {
      console.error('Error adding modification:', insertError);
      // If it's an RLS error, provide a more helpful message
      if (insertError.message.includes('violates row level security policy')) {
        return NextResponse.json({
          error: 'Permission denied. Please ensure you own this vehicle and the database is properly configured.'
        }, { status: 403 });
      }
      return NextResponse.json({ error: `Failed to add modification: ${insertError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      modEntryId: modEntry.id,
      message: 'Modification added successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in add-mod API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
