import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  try {
    console.log('Vehicles API called')

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No auth header in vehicles API')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    console.log('Token extracted, length:', token.length)

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
      console.log('Auth error in vehicles API:', authError)
      return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 })
    }

    console.log('User authenticated in vehicles API:', user.id)

    // Fetch user's vehicles directly
    const { data: userVehicles, error: vehiclesError } = await authenticatedSupabase
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

    console.log('Fetched vehicles from DB, count:', userVehicles?.length || 0)

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

    console.log('Returning vehicles, count:', vehicles.length)

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
