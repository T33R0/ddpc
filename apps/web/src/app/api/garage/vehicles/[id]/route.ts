import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const vehicleSlug = resolvedParams.id

    // First, try to find the vehicle by nickname
    let { data: vehicle, error: vehicleError } = await supabase
      .from('user_vehicle')
      .select(`
        *,
        vehicle_data ( make, model, year, trim, body_type, fuel_type, drive_type )
      `)
      .eq('owner_id', user.id)
      .eq('nickname', vehicleSlug)
      .single()

    // If not found by nickname, try by ID
    if (!vehicle && !vehicleError) {
      const { data: vehicleById, error: idError } = await supabase
        .from('user_vehicle')
        .select(`
          *,
          vehicle_data ( make, model, year, trim, body_type, fuel_type, drive_type )
        `)
        .eq('owner_id', user.id)
        .eq('id', vehicleSlug)
        .single()

      vehicle = vehicleById
      vehicleError = idError
    }

    if (vehicleError || !vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    // Get latest odometer reading
    const { data: odometerLogs } = await supabase
      .from('odometer_log')
      .select('reading_mi, recorded_at')
      .eq('user_vehicle_id', vehicle.id)
      .order('recorded_at', { ascending: false })
      .limit(1)

    const latestOdometer = odometerLogs?.[0]?.reading_mi || vehicle.odometer

    // Transform the data to match expected format
    const vehicleData = {
      id: vehicle.id,
      name: vehicle.nickname || vehicle.title || `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.trim || ''}`.trim() || 'Unnamed Vehicle',
      nickname: vehicle.nickname,
      ymmt: `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.trim || ''}`.trim(),
      odometer: latestOdometer,
      current_status: vehicle.current_status || 'inactive',
      image_url: vehicle.photo_url,
      // Include all the vehicle data fields
      ...vehicle,
      make: vehicle.vehicle_data?.make,
      model: vehicle.vehicle_data?.model,
      year: vehicle.vehicle_data?.year,
      trim: vehicle.vehicle_data?.trim,
      body_type: vehicle.vehicle_data?.body_type,
      fuel_type: vehicle.vehicle_data?.fuel_type,
      drive_type: vehicle.vehicle_data?.drive_type,
    }

    return NextResponse.json({
      vehicle: vehicleData
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}