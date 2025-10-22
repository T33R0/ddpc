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

    // Fetch user's vehicles
    const { data: userVehicles, error: vehiclesError } = await supabase
      .from('user_vehicle')
      .select('id, nickname, year, make, model, trim, odometer, title')
      .eq('owner_id', user.id)

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

    // Fetch user's preferred vehicle ID
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profile')
      .select('preferred_vehicle_id')
      .eq('user_id', user.id)
      .single()

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
        ymmt: `${uv.year || ''} ${uv.make || ''} ${uv.model || ''} ${uv.trim || ''}`.trim(),
        odometer: latestMileage
      }
    })

    return NextResponse.json({
      vehicles,
      preferredVehicleId: userProfile?.preferred_vehicle_id || null
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
