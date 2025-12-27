import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface OdometerLog {
  user_vehicle_id: string;
  reading_mi: number;
  recorded_at: string;
}

interface UserVehicle {
  id: string;
  nickname: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  odometer: number | null;
  title: string | null;
  current_status: string | null;
  photo_url: string | null;
  vehicle_image: string | null;
  created_at: string;
  last_event_at: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get pagination and sort parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '24');
    const offset = (page - 1) * limit;

    // Sort parameters
    const sortBy = url.searchParams.get('sort_by') || 'last_edited';
    const sortDir = url.searchParams.get('sort_direction') === 'asc' ? 'asc' : 'desc';

    // Check if this is a request for stored vehicles only
    const storedOnly = url.searchParams.get('stored_only') === 'true';

    // Fetch user's vehicles with pagination
    // Removing updated_at as it does not exist on user_vehicle
    let query = supabase
      .from('user_vehicle')
      .select('id, nickname, year, make, model, trim, odometer, title, current_status, photo_url, vehicle_image, created_at, last_event_at')
      .eq('owner_id', user.id);

    // Filter for stored vehicles if requested
    if (storedOnly) {
      query = query.in('current_status', ['inactive', 'archived']);
    }

    // Apply sorting
    if (storedOnly) {
      switch (sortBy) {
        case 'year':
          query = query.order('year', { ascending: sortDir === 'asc', nullsFirst: false });
          break;
        case 'status':
          // For status, simple alphabetical sort.
          // inactive, Archived -> Archived, inactive
          query = query.order('current_status', { ascending: sortDir === 'asc' });
          break;
        case 'ownership_period':
          // Oldest created_at first = longest ownership (if current owner) or oldest history
          query = query.order('created_at', { ascending: sortDir === 'asc' });
          break;
        case 'last_edited':
        default:
          // Try to sort by last_event_at, fallback to created_at
          // Supabase order() supports nullsFirst/nullsLast.
          // We want the most recent event first.
          query = query
            .order('last_event_at', { ascending: sortDir === 'asc', nullsFirst: false })
            .order('created_at', { ascending: sortDir === 'asc', nullsFirst: false });
          break;
      }
    }

    const { data: userVehicles, error: vehiclesError } = await query
      .range(offset, offset + limit - 1);

    if (vehiclesError) {
      console.error('Error fetching vehicles:', vehiclesError)
      return NextResponse.json(
        { error: 'Failed to fetch vehicles', details: vehiclesError.message },
        { status: 500 }
      )
    }

    // Fetch latest odometer readings for all user's vehicles
    const vehicleIds = userVehicles?.map(v => v.id) || []
    const { data: odometerLogs, error: odometerError } = vehicleIds.length > 0 ? await supabase
      .from('odometer_log')
      .select('user_vehicle_id, reading_mi, recorded_at')
      .in('user_vehicle_id', vehicleIds)
      .order('recorded_at', { ascending: false }) : { data: [], error: null }

    if (odometerError) {
      console.error('Error fetching odometer logs:', odometerError)
      // Don't fail the request if odometer logs fail, just continue without them
    }

    // Fetch user's preferred vehicle ID (handle case where column doesn't exist)
    let preferredVehicleId = null;
    try {
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profile')
        .select('preferred_vehicle_id')
        .eq('user_id', user.id)
        .single();

      if (!profileError) {
        preferredVehicleId = userProfile?.preferred_vehicle_id || null;
      } else if (profileError.message.includes('column') && profileError.message.includes('does not exist')) {
        console.warn('preferred_vehicle_id column does not exist yet');
        preferredVehicleId = null;
      } else {
        console.error('Error fetching user profile:', profileError);
      }
    } catch (profileError) {
      console.error('Exception fetching user profile:', profileError);
      // Continue without preferred vehicle ID
    }

    // Create a map of latest odometer readings by vehicle ID
    const latestMileageMap = new Map<string, number>()
    if (odometerLogs) {
      // Group by vehicle and take the most recent reading
      const groupedLogs = odometerLogs.reduce((acc, log) => {
        const current = acc[log.user_vehicle_id];
        if (!current || current.recorded_at < log.recorded_at) {
          acc[log.user_vehicle_id] = log
        }
        return acc
      }, {} as Record<string, OdometerLog>)

      Object.values(groupedLogs).forEach((log) => {
        latestMileageMap.set(log.user_vehicle_id, log.reading_mi)
      })
    }

    // Transform vehicles to match expected format
    const vehicles = (userVehicles || []).map((uv: UserVehicle) => {
      const latestMileage = latestMileageMap.get(uv.id) ?? uv.odometer ?? null
      return {
        id: uv.id,
        name: uv.nickname || uv.title || `${uv.year || ''} ${uv.make || ''} ${uv.model || ''} ${uv.trim || ''}`.trim() || 'Unnamed Vehicle',
        nickname: uv.nickname,
        ymmt: `${uv.year || ''} ${uv.make || ''} ${uv.model || ''} ${uv.trim || ''}`.trim(),
        odometer: latestMileage,
        current_status: uv.current_status || 'inactive',
        image_url: uv.vehicle_image || uv.photo_url,
        vehicle_image: uv.vehicle_image,
        created_at: uv.created_at,
        last_event_at: uv.last_event_at
      }
    })

    // If this is a paginated request, return pagination info
    if (storedOnly) {
      return NextResponse.json({
        vehicles,
        hasMore: vehicles.length === limit,
        page,
        limit
      })
    }

    return NextResponse.json({
      vehicles,
      preferredVehicleId
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
