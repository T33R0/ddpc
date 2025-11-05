import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      vehicleId,
      title,
      description,
      status,
      cost,
      odometer,
      event_date
    } = body

    // Validate required fields
    if (!vehicleId || !title || !status || !event_date) {
      return NextResponse.json(
        { error: 'Missing required fields: vehicleId, title, status, event_date' },
        { status: 400 }
      )
    }

    // Verify the vehicle belongs to the user
    const { data: vehicle, error: vehicleError } = await supabase
      .from('user_vehicle')
      .select('id')
      .eq('id', vehicleId)
      .eq('owner_id', user.id)
      .single()

    if (vehicleError || !vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found or access denied' },
        { status: 404 }
      )
    }

    // Insert the modification
    const { data: mod, error: modError } = await supabase
      .from('mods')
      .insert({
        user_vehicle_id: vehicleId,
        title,
        description: description || null,
        status,
        cost: cost ? parseFloat(cost) : null,
        odometer: odometer ? parseInt(odometer) : null,
        event_date: new Date(event_date).toISOString()
      })
      .select()
      .single()

    if (modError) {
      console.error('Error creating mod:', modError)
      return NextResponse.json(
        { error: 'Failed to create modification' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      mod
    })

  } catch (error) {
    console.error('Error in log-mod API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
