import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's garage
    const { data: garageData, error: garageError } = await supabase
      .from('garage')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (garageError) {
      if (garageError.code === 'PGRST116') {
        // No garage found, return empty array
        return NextResponse.json({
          vehicles: [],
          message: 'No garage found for user'
        })
      }
      throw garageError
    }

    // Fetch user's vehicles from this garage
    const { data: userVehicles, error: vehiclesError } = await supabase
      .from('user_vehicle')
      .select('*')
      .eq('garage_id', garageData.id)

    if (vehiclesError) {
      console.error('Error fetching vehicles:', vehiclesError)
      return NextResponse.json(
        { error: 'Failed to fetch vehicles', details: vehiclesError.message },
        { status: 500 }
      )
    }

    // Transform the data to match expected format
    const vehicles = (userVehicles || []).map((uv: any) => ({
      ...uv.spec_snapshot,
      id: uv.id,
      garage_id: uv.garage_id,
      nickname: uv.nickname,
      current_status: uv.current_status,
      privacy: uv.privacy,
      title: uv.title,
    }))

    return NextResponse.json({
      vehicles,
      total: vehicles.length
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
