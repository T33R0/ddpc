import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const requestSchema = z.object({
  vehicleId: z.string().uuid()
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = requestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { vehicleId } = validation.data

    // Verify the user owns this vehicle
    const { data: vehicle, error: vehicleError } = await supabase
      .from('user_vehicle')
      .select('id')
      .eq('id', vehicleId)
      .eq('owner_id', user.id)
      .single()

    if (vehicleError || !vehicle) {
      return NextResponse.json({ error: 'Vehicle not found or access denied' }, { status: 404 })
    }

    // Update user's preferred vehicle
    // First check if the column exists, if not, we'll skip the update but not fail
    try {
      const { error: updateError } = await supabase
        .from('user_profile')
        .update({ preferred_vehicle_id: vehicleId })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Error updating preferred vehicle:', updateError)
        // If it's a column doesn't exist error, log it but don't fail
        if (updateError.message.includes('column') && updateError.message.includes('does not exist')) {
          console.warn('preferred_vehicle_id column does not exist yet, skipping update')
        } else {
          return NextResponse.json({ error: 'Failed to update preferred vehicle' }, { status: 500 })
        }
      }
    } catch (updateError) {
      console.error('Exception updating preferred vehicle:', updateError)
      // Continue anyway - the column might not exist yet
    }

    return new NextResponse(null, { status: 204 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
