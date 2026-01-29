'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export async function toggleVehiclePrivacy(vehicleId: string) {
  const schema = z.string().uuid()
  const parse = schema.safeParse(vehicleId)

  if (!parse.success) {
    return { error: 'Invalid Vehicle ID' }
  }

  const supabase = await createClient()

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Unauthorized' }
    }

    // Fetch current vehicle to check ownership and current privacy
    const { data: vehicle, error: fetchError } = await supabase
      .from('user_vehicle')
      .select('id, privacy, owner_id')
      .eq('id', vehicleId)
      .single()

    if (fetchError || !vehicle) {
      return { error: 'Vehicle not found' }
    }

    if (vehicle.owner_id !== user.id) {
      return { error: 'Unauthorized' }
    }

    const newPrivacy = vehicle.privacy === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC'

    const { error: updateError } = await supabase
      .from('user_vehicle')
      .update({ privacy: newPrivacy })
      .eq('id', vehicleId)

    if (updateError) {
      console.error('Error updating vehicle privacy:', updateError)
      return { error: 'Failed to update privacy' }
    }

    // Revalidate the profile page - but we don't know the username here easily.
    // However, we can revalidate the current path if called from a server action in a component that knows it,
    // or just revalidate general paths.
    // Since we are likely on the profile page /u/[username], we want that to update.
    // We can also revalidate /vehicle/[id] just in case.
    revalidatePath(`/vehicle/${vehicleId}`)
    // We'll rely on the client to refresh the router or optimistic UI, but let's try to revalidate the profile path if possible.
    // Since we don't have username, we can't target /u/[username] specifically without querying user_profile.

    // Let's fetch username to be thorough
    const { data: userProfile } = await supabase
        .from('user_profile')
        .select('username')
        .eq('user_id', user.id)
        .single()

    if (userProfile?.username) {
        revalidatePath(`/u/${userProfile.username}`)
    }

    return { success: true, newPrivacy }
  } catch (error) {
    console.error('Unexpected error toggling privacy:', error)
    return { error: 'An unexpected error occurred' }
  }
}
