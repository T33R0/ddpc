import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { apiSuccess, unauthorized, badRequest, notFound, forbidden, serverError } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { garageId, email } = body

    if (!garageId || !email) {
      return badRequest('Missing required fields: garageId and email')
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
      return forbidden('Unauthorized to share this garage')
    }

    // Find the user to share with
    const { data: userToShareWith, error: userError } = await supabase
      .from('profiles') // Assuming you have a profiles table
      .select('id')
      .eq('email', email)
      .single()

    if (userError) {
      return notFound('User not found')
    }

    // Check if already shared
    const { data: existingShare } = await supabase
      .from('garage_shares')
      .select('id')
      .eq('garage_id', garageId)
      .eq('shared_with_user_id', userToShareWith.id)
      .single()

    if (existingShare) {
      return badRequest('Garage already shared with this user')
    }

    // Create the share record
    const { error: shareError } = await supabase
      .from('garage_shares')
      .insert({
        garage_id: garageId,
        shared_with_user_id: userToShareWith.id,
        permissions: 'VIEW' // Can be VIEW, EDIT, etc.
      })

    if (shareError) {
      console.error('Error sharing garage:', shareError)
      return serverError()
    }

    return apiSuccess({
      success: true,
      message: 'Garage shared successfully'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return serverError()
  }
}
