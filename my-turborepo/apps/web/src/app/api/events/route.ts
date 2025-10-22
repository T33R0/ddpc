import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createEventSchema = z.object({
  vehicleId: z.string(),
  kind: z.enum(['MOD_INSTALL']),
  title: z.string(),
  occurredAt: z.string(),
  odometer: z.number(),
  partId: z.string().optional(),
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
    const validation = createEventSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { vehicleId, kind, title, occurredAt, odometer, partId } = validation.data;

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

    // For MOD_INSTALL, save to mods table
    if (kind === 'MOD_INSTALL') {
      try {
        const { data: modData, error: modError } = await supabase
          .from('mods')
          .insert({
            user_vehicle_id: vehicleId,
            title,
            status: 'installed',
            event_date: occurredAt,
            odometer,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (modError) {
          console.error('Error creating mod:', modError);
          // If it's an RLS error, provide a more helpful message
          if (modError.message.includes('violates row level security policy')) {
            return NextResponse.json({
              error: 'Permission denied. Please ensure you own this vehicle and the database is properly configured.'
            }, { status: 403 });
          }
          return NextResponse.json({ error: `Failed to create mod event: ${modError.message}` }, { status: 500 });
        }

        return NextResponse.json({ success: true, eventId: modData.id }, { status: 201 });
      } catch (insertError) {
        console.error('Exception creating mod:', insertError);
        return NextResponse.json({ error: 'Failed to create mod event due to server error' }, { status: 500 });
      }
    }

    // For other kinds, return not implemented for now
    return NextResponse.json({ error: 'Event kind not implemented' }, { status: 400 });

  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

