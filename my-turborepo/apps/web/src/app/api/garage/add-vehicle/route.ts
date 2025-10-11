import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('Add vehicle API called')

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('No auth header')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    console.log('Token extracted, length:', token.length)

    // Create authenticated Supabase client
    const authenticatedSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    // Verify the token and get user
    const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 })
    }

    console.log('User authenticated:', user.id)

    const body = await request.json()
    const { vehicleDataId } = body
    console.log('Request body:', { vehicleDataId })

    if (!vehicleDataId) {
      console.error('Missing vehicleDataId')
      return NextResponse.json(
        { error: 'Missing required field: vehicleDataId' },
        { status: 400 }
      )
    }

    // Execute the vehicle cloning logic using raw SQL
    // First, get the vehicle data
    console.log('Fetching vehicle data for ID:', vehicleDataId)
    const { data: vehicleData, error: vehicleError } = await authenticatedSupabase
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

    console.log('Vehicle data found:', vehicleData.make, vehicleData.model)

    // Create the JSON snapshot
    const fullSpec = JSON.parse(JSON.stringify(vehicleData))
    console.log('Created spec snapshot')

    console.log('Inserting user_vehicle with owner_id:', user.id)
    const { data: newVehicle, error: insertError } = await authenticatedSupabase
      .from('user_vehicle')
      .insert({
        owner_id: user.id,
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
      console.error('Insert error details:', JSON.stringify(insertError, null, 2))
      return NextResponse.json(
        { error: 'Failed to add vehicle to collection', details: insertError.message },
        { status: 500 }
      )
    }

    console.log('Successfully inserted vehicle with ID:', newVehicle.id)

    return NextResponse.json({
      success: true,
      vehicleId: newVehicle.id,
      message: 'Vehicle successfully added to collection'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
