import { createClient } from '@/lib/supabase/server'

// Helper function to check if a string is a UUID
export function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

/**
 * Resolves a vehicle slug (nickname or UUID) to a vehicle UUID and nickname
 * @param vehicleSlug - The vehicle slug from the URL (can be nickname or UUID)
 * @returns Object with vehicle UUID and nickname, or null if not found
 */
export async function resolveVehicleSlug(vehicleSlug: string): Promise<{
  vehicleId: string
  nickname: string | null
} | null> {
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  // Decode the slug in case it's URL encoded
  const decodedSlug = decodeURIComponent(vehicleSlug)
  const isLikelyUUID = isUUID(decodedSlug)

  let vehicle
  let vehicleError

  // If it looks like a UUID, try ID first, otherwise try nickname first
  if (isLikelyUUID) {
    // Try by ID first
    const { data: vehicleById, error: idError } = await supabase
      .from('user_vehicle')
      .select('id, nickname')
      .eq('owner_id', user.id)
      .eq('id', decodedSlug)
      .single()

    vehicle = vehicleById
    vehicleError = idError

    // If not found by ID, try by nickname (in case UUID matches a nickname somehow)
    if (!vehicle && !vehicleError) {
      const { data: vehicleByNickname, error: nicknameError } = await supabase
        .from('user_vehicle')
        .select('id, nickname')
        .eq('owner_id', user.id)
        .eq('nickname', decodedSlug)
        .single()

      vehicle = vehicleByNickname
      vehicleError = nicknameError
    }
  } else {
    // Try by nickname first
    if (decodedSlug && decodedSlug.trim()) {
      const { data: vehicleByNickname, error: nicknameError } = await supabase
        .from('user_vehicle')
        .select('id, nickname')
        .eq('owner_id', user.id)
        .eq('nickname', decodedSlug)
        .single()

      vehicle = vehicleByNickname
      vehicleError = nicknameError
    }

    // If not found by nickname, try by ID (fallback)
    if (!vehicle && !vehicleError) {
      const { data: vehicleById, error: idError } = await supabase
        .from('user_vehicle')
        .select('id, nickname')
        .eq('owner_id', user.id)
        .eq('id', decodedSlug)
        .single()

      vehicle = vehicleById
      vehicleError = idError
    }
  }

  if (vehicleError || !vehicle) {
    return null
  }

  return {
    vehicleId: vehicle.id,
    nickname: vehicle.nickname || null,
  }
}

