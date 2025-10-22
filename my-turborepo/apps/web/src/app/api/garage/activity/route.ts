import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Activity = {
  occurredAt: string;
  eventType: string;
  title: string;
  odometerMi: number | null;
};

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

    // Get mod activities
    const { data: modActivities, error: modError } = await supabase
      .from('mods')
      .select('title, event_date, odometer')
      .eq('user_vehicle_id', vehicleId)
      .not('event_date', 'is', null)
      .order('event_date', { ascending: false })
      .limit(20);

    // Get maintenance activities
    const { data: maintenanceActivities, error: maintenanceError } = await supabase
      .from('maintenance_log')
      .select('description, event_date, odometer')
      .eq('user_vehicle_id', vehicleId)
      .order('event_date', { ascending: false })
      .limit(20);

    // Combine and sort activities
    const activities: Activity[] = [];

    // Add mod activities
    if (modActivities) {
      modActivities.forEach(mod => {
        activities.push({
          occurredAt: mod.event_date,
          eventType: 'mod',
          title: mod.title,
          odometerMi: mod.odometer
        });
      });
    }

    // Add maintenance activities
    if (maintenanceActivities) {
      maintenanceActivities.forEach(maintenance => {
        activities.push({
          occurredAt: maintenance.event_date,
          eventType: 'maintenance',
          title: maintenance.description,
          odometerMi: maintenance.odometer
        });
      });
    }

    // Sort by date descending and limit to 20
    activities.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
    const recentActivities = activities.slice(0, 20);

    return NextResponse.json({ items: recentActivities });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
