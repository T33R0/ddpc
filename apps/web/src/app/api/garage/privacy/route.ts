import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { apiSuccess, unauthorized, badRequest, notFound, forbidden, serverError } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { garageId, privacy } = body

    if (!garageId || !privacy) {
      return badRequest('Missing required fields: garageId and privacy')
    }

    if (!['PRIVATE', 'PUBLIC'].includes(privacy)) {
      return badRequest('Invalid privacy setting')
    }

    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorized()
    }

    // Verify the garage belongs to the current user
    const { data: garageData, error: garageError } = await supabase
      .from('garage')
      .select('id, owner_id')
      .eq('id', garageId)
      .single()

    if (garageError || !garageData) {
      return notFound('Garage not found')
    }

    if (garageData.owner_id !== user.id) {
      return forbidden('Unauthorized to modify this garage')
    }

    // Update garage privacy
    const { error: updateError } = await supabase
      .from('garage')
      .update({ privacy })
      .eq('id', garageId)

    if (updateError) {
      console.error('Error updating garage privacy:', updateError)
      return serverError()
    }

    return apiSuccess({
      success: true,
      message: 'Garage privacy updated successfully'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return serverError()
  }
}
