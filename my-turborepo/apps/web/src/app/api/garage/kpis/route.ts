import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPlanForUser } from '@/lib/plan-utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get vehicle ID from query params
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');

    if (!vehicleId) {
      return NextResponse.json({ error: 'Vehicle ID is required' }, { status: 400 });
    }

    // Verify user owns this vehicle
    const { data: vehicle, error: vehicleError } = await supabase
      .from('user_vehicle')
      .select('owner_id')
      .eq('id', vehicleId)
      .eq('owner_id', user.id)
      .single();

    if (vehicleError || !vehicle) {
      return NextResponse.json({ error: 'Vehicle not found or access denied' }, { status: 404 });
    }

    // Get count of user's vehicles
    const { count: vehicleCount, error: countError } = await supabase
      .from('user_vehicle')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', user.id);

    // Get last event date from mods and maintenance_log for this vehicle
    const { data: modEvents, error: modError } = await supabase
      .from('mods')
      .select('event_date')
      .eq('user_vehicle_id', vehicleId)
      .not('event_date', 'is', null)
      .order('event_date', { ascending: false })
      .limit(1);

    const { data: maintenanceEvents, error: maintenanceError } = await supabase
      .from('maintenance_log')
      .select('event_date')
      .eq('user_vehicle_id', vehicleId)
      .order('event_date', { ascending: false })
      .limit(1);

    // Find the most recent event date
    const modDate = modEvents?.[0]?.event_date;
    const maintenanceDate = maintenanceEvents?.[0]?.event_date;
    const lastEventDate = modDate && maintenanceDate
      ? (new Date(modDate) > new Date(maintenanceDate) ? modDate : maintenanceDate)
      : (modDate || maintenanceDate);

    // Get user plan to determine vehicle limit
    const plan = await getPlanForUser(user.id);
    const vehicleLimits = { free: 2, builder: 3, pro: 10 };
    const limit = vehicleLimits[plan as keyof typeof vehicleLimits] || 2;

    // Format last event date
    const lastEventValue = lastEventDate
      ? new Date(lastEventDate).toLocaleDateString()
      : 'Never';

    // Create KPIs
    const tiles = [
      {
        key: 'lastEvent',
        label: 'Last Event',
        value: lastEventValue
      },
      {
        key: 'vehicles',
        label: 'Vehicles Active',
        value: `${vehicleCount || 0}/${limit}`
      }
    ];

    return NextResponse.json({ tiles });
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
