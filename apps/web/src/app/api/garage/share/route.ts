import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { garageId, email } = body

    if (!garageId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: garageId and email' },
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
        { error: 'Unauthorized to share this garage' },
        { status: 403 }
      )
    }

    // Find the user to share with
    const { data: userToShareWith, error: userError } = await supabase
      .from('profiles') // Assuming you have a profiles table
      .select('id')
      .eq('email', email)
      .single()

    if (userError) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already shared
    const { data: existingShare } = await supabase
      .from('garage_shares')
      .select('id')
      .eq('garage_id', garageId)
      .eq('shared_with_user_id', userToShareWith.id)
      .single()

    if (existingShare) {
      return NextResponse.json(
        { error: 'Garage already shared with this user' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { error: 'Failed to share garage', details: shareError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Garage shared successfully'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
