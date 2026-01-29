import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const deleteModSchema = z.object({
  modId: z.string(),
  vehicleId: z.string(), // Required for ownership check
});

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const validation = deleteModSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.issues }, { status: 400 });
    }

    const { modId, vehicleId } = validation.data;

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

    // Verify mod belongs to this vehicle (extra safety)
    const { data: existingMod, error: modError } = await supabase
      .from('mods')
      .select('id')
      .eq('id', modId)
      .eq('user_vehicle_id', vehicleId)
      .single();

    if (modError || !existingMod) {
      return NextResponse.json({ error: 'Modification record not found' }, { status: 404 });
    }

    // Perform deletion
    const { error: deleteError } = await supabase
      .from('mods')
      .delete()
      .eq('id', modId);

    if (deleteError) {
      console.error('Error deleting modification:', deleteError);
      return NextResponse.json({ error: `Failed to delete modification: ${deleteError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Modification deleted successfully'
    });

  } catch (error) {
    console.error('Error in delete-mod API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
