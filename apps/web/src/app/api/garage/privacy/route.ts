import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { garageId, privacy } = body

    if (!garageId || !privacy) {
      return NextResponse.json(
        { error: 'Missing required fields: garageId and privacy' },
        { status: 400 }
      )
    }

    if (!['PRIVATE', 'PUBLIC'].includes(privacy)) {
      return NextResponse.json(
        { error: 'Invalid privacy setting' },
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

    // Verify the garage belongs to the current user
    const { data: garageData, error: garageError } = await supabase
      .from('garage')
      .select('id, owner_id')
      .eq('id', garageId)
      .single()

    if (garageError || !garageData) {
      return NextResponse.json(
        { error: 'Garage not found' },
        { status: 404 }
      )
    }

    if (garageData.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to modify this garage' },
        { status: 403 }
      )
    }

    // Update garage privacy
    const { error: updateError } = await supabase
      .from('garage')
      .update({ privacy })
      .eq('id', garageId)

    if (updateError) {
      console.error('Error updating garage privacy:', updateError)
      return NextResponse.json(
        { error: 'Failed to update garage privacy', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Garage privacy updated successfully'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
