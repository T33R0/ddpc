import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vehicleId, nickname, status } = body

    if (!vehicleId) {
      return NextResponse.json(
        { error: 'Missing required field: vehicleId' },
        { status: 400 }
      )
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Update the vehicle
    const updateData: any = {}
    if (nickname !== undefined) updateData.nickname = nickname
    if (status !== undefined) updateData.current_status = status

    const { data: updatedVehicle, error: updateError } = await supabase
      .from('user_vehicle')
      .update(updateData)
      .eq('id', vehicleId)
      .eq('garage_id', (
        await supabase
          .from('garage')
          .select('id')
          .eq('owner_id', user.id)
          .single()
      ).data?.id)
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
