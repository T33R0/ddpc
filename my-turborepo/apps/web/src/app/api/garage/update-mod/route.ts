import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateAndRecordOdometerReading } from '@/lib/odometer-service';
import { z } from 'zod';

const updateModSchema = z.object({
  modId: z.string(),
  vehicleId: z.string(),
  notes: z.string().min(1, 'Modification notes/description is required'),
  mod_item_id: z.string().optional(),
  status: z.enum(['planned', 'ordered', 'installed', 'tuned', 'archived']),
  cost: z.string().optional(),
  odometer: z.string().optional(),
  event_date: z.string().optional(),
});

interface ModUpdateData {
  notes: string;
  mod_item_id?: string;
  status: string;
  cost?: number | null;
  odometer?: number | null;
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
    const validation = updateModSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.issues }, { status: 400 });
    }

    const { modId, vehicleId, notes, mod_item_id, status, cost, odometer, event_date } = validation.data;

    // Verify user owns the vehicle associated with this mod
    const { data: vehicle, error: vehicleError } = await supabase
      .from('user_vehicle')
      .select('id')
      .eq('id', vehicleId)
      .eq('owner_id', user.id)
      .single();

    if (vehicleError || !vehicle) {
      return NextResponse.json({ error: 'Vehicle not found or access denied' }, { status: 404 });
    }

    // Verify mod belongs to this vehicle
    const { data: existingMod, error: modError } = await supabase
      .from('mods')
      .select('id')
      .eq('id', modId)
      .eq('user_vehicle_id', vehicleId)
      .single();

    if (modError || !existingMod) {
      return NextResponse.json({ error: 'Modification record not found' }, { status: 404 });
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
    }

    // Prepare update data
    const updateData: ModUpdateData = {
      notes: notes.trim(),
      status,
      // Handle cost: if empty string or undefined, set to null if intended, or keep existing?
      // Zod schema makes them optional strings. If provided but empty string?
      // The logic below sets to costValue which is number or null.
      // If user sends explicit empty string for cost, costValue is NaN (wait, parseFloat("") is NaN).
      // Let's refine parsing.
    };

    // Explicit null handling
    if (cost === '') updateData.cost = null;
    else if (costValue !== null) updateData.cost = costValue;

    if (odometer === '') updateData.odometer = null;
    else if (odometerValue !== null) updateData.odometer = odometerValue;

    if (mod_item_id) updateData.mod_item_id = mod_item_id;
    if (event_date) updateData.event_date = event_date;

    const { error: updateError } = await supabase
      .from('mods')
      .update(updateData)
      .eq('id', modId);

    if (updateError) {
      console.error('Error updating modification:', updateError);
      return NextResponse.json({ error: `Failed to update modification: ${updateError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Modification updated successfully'
    });

  } catch (error) {
    console.error('Error in update-mod API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
