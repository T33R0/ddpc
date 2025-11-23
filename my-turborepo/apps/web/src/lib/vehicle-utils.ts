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
/**
 * Creates a URL-friendly slug from a string
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-')   // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start of text
    .replace(/-+$/, '')       // Trim - from end of text
}

/**
 * Determines the best slug for a vehicle
 * Priority:
 * 1. Nickname (if unique among user's vehicles)
 * 2. YMMT (Year-Make-Model-Trim) (if unique among user's vehicles)
 * 3. ID (fallback)
 */
export function getVehicleSlug(vehicle: { id: string, nickname?: string | null, year?: number | string, make?: string, model?: string, trim?: string }, allVehicles: { id: string, nickname?: string | null, year?: number | string, make?: string, model?: string, trim?: string }[]): string {
  // 1. Check Nickname
  if (vehicle.nickname) {
    const isNicknameUnique = !allVehicles.some(v =>
      v.id !== vehicle.id &&
      v.nickname?.toLowerCase() === vehicle.nickname?.toLowerCase()
    )

    if (isNicknameUnique) {
      return vehicle.nickname
    }
  }

  // 2. Check YMMT
  // Construct YMMT string
  const ymmtParts = [
    vehicle.year,
    vehicle.make,
    vehicle.model,
    vehicle.trim
  ].filter(Boolean).join(' ')

  const ymmtSlug = slugify(ymmtParts)

  if (ymmtSlug) {
    // Check if any other vehicle generates the same YMMT slug
    const isYmmtUnique = !allVehicles.some(v => {
      if (v.id === vehicle.id) return false

      const otherParts = [
        v.year,
        v.make,
        v.model,
        v.trim
      ].filter(Boolean).join(' ')

      return slugify(otherParts) === ymmtSlug
    })

    if (isYmmtUnique) {
      return ymmtSlug
    }
  }

  // 3. Fallback to ID
  return vehicle.id
}

/**
 * Resolves a vehicle slug (nickname, YMMT slug, or UUID) to a vehicle UUID and nickname
 * @param vehicleSlug - The vehicle slug from the URL
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
    // If no user, we can only resolve UUIDs or public slugs (which is handled in page.tsx)
    // For this utility which assumes user context, we might just return null or throw
    // But let's check if it's a UUID and return it if so, assuming caller handles auth check
    if (isUUID(vehicleSlug)) {
      return { vehicleId: vehicleSlug, nickname: null }
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
    return null
  }

  // 1. Try Exact ID Match
  const idMatch = vehicles.find(v => v.id === decodedSlug)
  if (idMatch) {
    return { vehicleId: idMatch.id, nickname: idMatch.nickname }
  }

  // 2. Try Nickname Match (Case Insensitive)
  // Note: If multiple vehicles have same nickname, we need to see if this slug matches the *unique* one
  // But wait, if they have duplicate nicknames, getVehicleSlug wouldn't have used the nickname.
  // However, if the user types it in manually, we should probably still try to find it.
  // If there are duplicates, it's ambiguous. Let's pick the first one or strict match.
  // Let's stick to the reverse logic of getVehicleSlug.

  for (const vehicle of vehicles) {
    const calculatedSlug = getVehicleSlug(vehicle, vehicles)
    if (calculatedSlug.toLowerCase() === decodedSlug.toLowerCase()) {
      return { vehicleId: vehicle.id, nickname: vehicle.nickname }
    }
  }

  // 3. Legacy/Loose Nickname Match
  // If we haven't found it via strict slug matching, try a direct nickname match
  // This handles cases where maybe the logic changed but old links exist, 
  // or if the user manually typed a shared nickname.
  const nicknameMatch = vehicles.find(v => v.nickname?.toLowerCase() === decodedSlug.toLowerCase())
  if (nicknameMatch) {
    return { vehicleId: nicknameMatch.id, nickname: nicknameMatch.nickname }
  }

  return null
}

