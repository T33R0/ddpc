import { createClient } from '@/lib/supabase/server'
import { SupabaseClient, User } from '@supabase/supabase-js'
// Import client-safe utilities
export { isUUID, slugify, getVehicleSlug } from './vehicle-utils-client'

/**
 * Resolves a vehicle slug (nickname, YMMT slug, or UUID) to a vehicle UUID and nickname
 * SERVER ONLY - Uses Supabase server client
 * @param vehicleSlug - The vehicle slug from the URL
 * @param existingClient - Optional existing Supabase client to reuse
 * @param existingUser - Optional existing authenticated user to reuse
 * @returns Object with vehicle UUID and nickname, or null if not found
 */
export async function resolveVehicleSlug(
  vehicleSlug: string,
  existingClient?: SupabaseClient,
  existingUser?: User | null
): Promise<{
  vehicleId: string
  nickname: string | null
  canonicalSlug: string
} | null> {
  const { isUUID, getVehicleSlug } = await import('./vehicle-utils-client')

  const supabase = existingClient ?? await createClient()

  // Get authenticated user
  let user = existingUser
  if (user === undefined) {
    const { data: { user: fetchedUser }, error: authError } = await supabase.auth.getUser()
    user = fetchedUser
    if (authError) {
      // console.error('Error fetching user in resolveVehicleSlug:', authError)
    }
  }

  if (!user) {
    // If no user, we can only resolve UUIDs or public slugs (which is handled in page.tsx)
    // For this utility which assumes user context, we might just return null or throw
    // But let's check if it's a UUID and return it if so, assuming caller handles auth check
    if (isUUID(vehicleSlug)) {
      return { vehicleId: vehicleSlug, nickname: null, canonicalSlug: vehicleSlug }
    }
    return null
  }

  // Decode the slug
  const decodedSlug = decodeURIComponent(vehicleSlug)

  // Fetch ALL user vehicles to perform the same matching logic as the frontend
  // This is efficient enough for a single user's garage
  const { data: vehicles, error } = await supabase
    .from('user_vehicle')
    .select('id, nickname, year, make, model, trim')
    .eq('owner_id', user.id)

  if (error || !vehicles) {
    console.error('Error fetching user vehicles for slug resolution:', error)
    return null
  }

  // Helper to calculate canonical slug
  const getCanonicalSlug = (vehicle: any) => {
    return getVehicleSlug(vehicle, vehicles)
  }

  // 1. Try Exact ID Match
  const idMatch = vehicles.find(v => v.id === decodedSlug)
  if (idMatch) {
    return {
      vehicleId: idMatch.id,
      nickname: idMatch.nickname,
      canonicalSlug: getCanonicalSlug(idMatch)
    }
  }

  // 2. Try Nickname Match (Case Insensitive)
  for (const vehicle of vehicles) {
    const calculatedSlug = getVehicleSlug(vehicle, vehicles)
    if (calculatedSlug.toLowerCase() === decodedSlug.toLowerCase()) {
      return {
        vehicleId: vehicle.id,
        nickname: vehicle.nickname,
        canonicalSlug: calculatedSlug
      }
    }
  }

  // 3. Legacy/Loose Nickname Match
  const nicknameMatch = vehicles.find(v => v.nickname?.toLowerCase() === decodedSlug.toLowerCase())
  if (nicknameMatch) {
    return {
      vehicleId: nicknameMatch.id,
      nickname: nicknameMatch.nickname,
      canonicalSlug: getCanonicalSlug(nicknameMatch)
    }
  }

  return null
}

