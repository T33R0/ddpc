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

    // Fetch user's vehicles directly
    const { data: userVehicles, error: vehiclesError } = await supabase
      .from('user_vehicle')
      .select('*')
      .eq('owner_id', user.id)

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
      owner_id: uv.owner_id,
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
