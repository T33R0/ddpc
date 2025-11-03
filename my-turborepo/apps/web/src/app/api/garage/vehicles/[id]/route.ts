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
    // First check if vehicle exists with basic info
    const basicQuery = supabase
      .from('user_vehicle')
      .select('id, nickname, year, make, model, trim, odometer, title, current_status, photo_url')
      .eq('owner_id', user.id)

    let { data: userVehicle, error: vehicleError } = await basicQuery
      .eq('nickname', decodedSlug)
      .single()

    // If not found by nickname, try by ID
    if (vehicleError && vehicleError.code === 'PGRST116') {
      const { data: userVehicleById, error: vehicleErrorById } = await basicQuery
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

    // Now get the additional fields if they exist
    const extendedQuery = supabase
      .from('user_vehicle')
      .select(`
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
        epa_combined_mpg
      `)
      .eq('id', userVehicle.id)
      .single()

    const { data: extendedData, error: extendedError } = await extendedQuery

    // Transform the data to match the expected format
    const transformedVehicle = {
      id: userVehicle.id,
      name: userVehicle.nickname || userVehicle.title || `${userVehicle.year || ''} ${userVehicle.make || ''} ${userVehicle.model || ''} ${userVehicle.trim || ''}`.trim() || 'Unnamed Vehicle',
      nickname: userVehicle.nickname,
      ymmt: `${userVehicle.year || ''} ${userVehicle.make || ''} ${userVehicle.model || ''} ${userVehicle.trim || ''}`.trim(),
      trim: userVehicle.trim,
      odometer: userVehicle.odometer,
      current_status: userVehicle.current_status || 'parked',
      // Include all vehicle specification fields from extended data (if available)
      horsepower_hp: extendedData?.horsepower_hp || null,
      torque_ft_lbs: extendedData?.torque_ft_lbs || null,
      engine_size_l: extendedData?.engine_size_l || null,
      cylinders: extendedData?.cylinders || null,
      fuel_type: extendedData?.fuel_type || null,
      drive_type: extendedData?.drive_type || null,
      transmission: extendedData?.transmission || null,
      length_in: extendedData?.length_in || null,
      width_in: extendedData?.width_in || null,
      height_in: extendedData?.height_in || null,
      body_type: extendedData?.body_type || null,
      colors_exterior: extendedData?.colors_exterior || null,
      epa_combined_mpg: extendedData?.epa_combined_mpg || null,
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
