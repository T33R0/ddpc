import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { vehicleDataId, garageId } = body

    if (!vehicleDataId || !garageId) {
      return NextResponse.json(
        { error: 'Missing required fields: vehicleDataId and garageId' },
        { status: 400 }
      )
    }

    // Execute the vehicle cloning logic using raw SQL
    // First, get the vehicle data
    const { data: vehicleData, error: vehicleError } = await supabase
      .from('vehicle_data')
      .select('*')
      .eq('id', vehicleDataId)
      .single()

    if (vehicleError || !vehicleData) {
      console.error('Error fetching vehicle data:', vehicleError)
      return NextResponse.json(
        { error: 'Vehicle not found', details: vehicleError?.message },
        { status: 404 }
      )
    }

    // Create the JSON snapshot
    const fullSpec = JSON.parse(JSON.stringify(vehicleData))

    // Insert into user_vehicle table
    // Get the current user's ID from the session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: newVehicle, error: insertError } = await supabase
      .from('user_vehicle')
      .insert({
        owner_id: user.id,
        garage_id: garageId,
        vin: null,
        year: parseInt(vehicleData.year),
        make: vehicleData.make,
        model: vehicleData.model,
        trim: vehicleData.trim,
        nickname: vehicleData.trim,
        privacy: 'PRIVATE',
        photo_url: vehicleData.image_url,
        stock_data_id: vehicleDataId,
        title: vehicleData.trim_description || vehicleData.trim,
        spec_snapshot: fullSpec,
        current_status: 'daily_driver'
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Error inserting vehicle:', insertError)
      return NextResponse.json(
        { error: 'Failed to add vehicle to garage', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      vehicleId: newVehicle.id,
      message: 'Vehicle successfully added to garage'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
