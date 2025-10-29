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

    const { id: vehicleSlug } = await params

    // First try to find vehicle by nickname (URL decoded)
    const decodedSlug = decodeURIComponent(vehicleSlug)
    const vehicleQuery = supabase
      .from('user_vehicle')
      .select(`
        id,
        nickname,
        year,
        make,
        model,
        trim,
        odometer,
        title,
        current_status,
        vehicle_id,
        horsepower_hp,
        torque_ft_lbs,
        engine_size_l,
        cylinders,
        fuel_type,
        drive_type,
        transmission,
        length_in,
        width_in,
        height_in,
        body_type,
        colors_exterior,
        epa_combined_mpg,
        photo_url
      `)
      .eq('owner_id', user.id)

    // Try to find by nickname first
    let { data: userVehicle, error: vehicleError } = await vehicleQuery
      .eq('nickname', decodedSlug)
      .single()

    // If not found by nickname, try by ID (for backward compatibility)
    if (vehicleError && vehicleError.code === 'PGRST116') {
      const { data: userVehicleById, error: vehicleErrorById } = await vehicleQuery
        .eq('id', vehicleSlug)
        .single()

      userVehicle = userVehicleById
      vehicleError = vehicleErrorById
    }

    if (vehicleError || !userVehicle) {
      console.error('Error fetching vehicle:', vehicleError)
      if (vehicleError?.code === 'PGRST116') {
        return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
      }
      return NextResponse.json(
        { error: 'Failed to fetch vehicle', details: vehicleError?.message },
        { status: 500 }
      )
    }

    // Transform the data to match the expected format
    const transformedVehicle = {
      id: userVehicle.id,
      name: userVehicle.nickname || userVehicle.title || `${userVehicle.year || ''} ${userVehicle.make || ''} ${userVehicle.model || ''} ${userVehicle.trim || ''}`.trim() || 'Unnamed Vehicle',
      ymmt: `${userVehicle.year || ''} ${userVehicle.make || ''} ${userVehicle.model || ''} ${userVehicle.trim || ''}`.trim(),
      odometer: userVehicle.odometer,
      current_status: userVehicle.current_status || 'parked',
      // Include all vehicle specification fields from user_vehicle
      horsepower_hp: userVehicle.horsepower_hp,
      torque_ft_lbs: userVehicle.torque_ft_lbs,
      engine_size_l: userVehicle.engine_size_l,
      cylinders: userVehicle.cylinders,
      fuel_type: userVehicle.fuel_type,
      drive_type: userVehicle.drive_type,
      transmission: userVehicle.transmission,
      length_in: userVehicle.length_in,
      width_in: userVehicle.width_in,
      height_in: userVehicle.height_in,
      body_type: userVehicle.body_type,
      colors_exterior: userVehicle.colors_exterior,
      epa_combined_mpg: userVehicle.epa_combined_mpg,
      image_url: userVehicle.photo_url
    }

    return NextResponse.json({
      vehicle: transformedVehicle
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
