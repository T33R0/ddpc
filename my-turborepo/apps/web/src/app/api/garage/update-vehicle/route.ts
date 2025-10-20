import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    console.log('Update vehicle API called')

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No auth header in update vehicle API')
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
      console.log('Auth error in update vehicle API:', authError)
      return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 })
    }

    console.log('User authenticated in update vehicle API:', user.id)

    const body = await request.json()
    const { vehicleId, nickname, status } = body
    console.log('Request body:', { vehicleId, nickname, status })

    if (!vehicleId) {
      console.log('Missing vehicleId')
      return NextResponse.json(
        { error: 'Missing required field: vehicleId' },
        { status: 400 }
      )
    }

    // Update the vehicle
    const updateData: any = {}
    if (nickname !== undefined) updateData.nickname = nickname
    if (status !== undefined) updateData.current_status = status

    const { data: updatedVehicle, error: updateError } = await authenticatedSupabase
      .from('user_vehicle')
      .update(updateData)
      .eq('id', vehicleId)
      .eq('owner_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating vehicle:', updateError)
      return NextResponse.json(
        { error: 'Failed to update vehicle', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      vehicle: updatedVehicle,
      message: 'Vehicle updated successfully'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
