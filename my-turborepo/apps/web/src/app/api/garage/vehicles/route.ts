import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get pagination parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '24');
    const offset = (page - 1) * limit;

    // Check if this is a request for stored vehicles only
    const storedOnly = url.searchParams.get('stored_only') === 'true';

    // Fetch user's vehicles with pagination
    let query = supabase
      .from('user_vehicle')
      .select('id, nickname, year, make, model, trim, odometer, title, current_status')
      .eq('owner_id', user.id);

    // Filter for stored vehicles if requested
    if (storedOnly) {
      query = query.in('current_status', ['parked', 'listed', 'sold', 'retired']);
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
        if (!acc[log.user_vehicle_id] || acc[log.user_vehicle_id].recorded_at < log.recorded_at) {
          acc[log.user_vehicle_id] = log
        }
        return acc
      }, {} as Record<string, any>)

      Object.values(groupedLogs).forEach((log: any) => {
        latestMileageMap.set(log.user_vehicle_id, log.reading_mi)
      })
    }

    // Transform vehicles to match expected format
    const vehicles = (userVehicles || []).map((uv: any) => {
      const latestMileage = latestMileageMap.get(uv.id) ?? uv.odometer
      return {
        id: uv.id,
        name: uv.nickname || uv.title || `${uv.year || ''} ${uv.make || ''} ${uv.model || ''} ${uv.trim || ''}`.trim() || 'Unnamed Vehicle',
        nickname: uv.nickname,
        ymmt: `${uv.year || ''} ${uv.make || ''} ${uv.model || ''} ${uv.trim || ''}`.trim(),
        odometer: latestMileage,
        current_status: uv.current_status || 'parked',
        image_url: uv.photo_url
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
