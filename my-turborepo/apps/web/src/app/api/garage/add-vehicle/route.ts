import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Create authenticated Supabase client with user's token
    const authenticatedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
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
      return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 })
    }

    const body = await request.json()
    const { vehicleDataId } = body

    if (!vehicleDataId) {
      return NextResponse.json(
        { error: 'Missing required field: vehicleDataId' },
        { status: 400 }
      )
    }

    // Execute the vehicle cloning logic using raw SQL
    // First, get the vehicle data
    const { data: vehicleData, error: vehicleError } = await authenticatedSupabase
      .from('vehicle_data')
      .select('*')
      .eq('id', vehicleDataId)
      .single()

    // Get the primary image
    const { data: primaryImage } = await authenticatedSupabase
      .from('vehicle_primary_image')
      .select('url')
      .eq('vehicle_id', vehicleDataId)
      .single()

    if (vehicleError || !vehicleData) {
      return NextResponse.json(
        { error: 'Vehicle not found', details: vehicleError?.message },
        { status: 404 }
      )
    }

    // Create the JSON snapshot
    const fullSpec = JSON.parse(JSON.stringify(vehicleData))

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
        photo_url: primaryImage?.url || '',
        stock_data_id: vehicleDataId,
        title: vehicleData.trim_description || vehicleData.trim,
        spec_snapshot: fullSpec,
        current_status: 'daily_driver'
      })
      .select('id')
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to add vehicle to collection', details: insertError.message },
        { status: 500 }
      )
    }

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
