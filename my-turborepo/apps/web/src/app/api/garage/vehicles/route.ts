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

    // Fetch user's vehicles and preferred vehicle ID
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

    // Fetch user's preferred vehicle ID
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profile')
      .select('preferred_vehicle_id')
      .eq('user_id', user.id)
      .single()

    // Transform vehicles to match expected format
    const vehicles = (userVehicles || []).map((uv: any) => ({
      id: uv.id,
      name: uv.nickname || uv.title || `${uv.year || ''} ${uv.make || ''} ${uv.model || ''} ${uv.trim || ''}`.trim() || 'Unnamed Vehicle',
      ymmt: `${uv.year || ''} ${uv.make || ''} ${uv.model || ''} ${uv.trim || ''}`.trim(),
      odometer: uv.odometer
    }))

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
