import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Fetches a public vehicle by slug (nickname or UUID) with full data
 * Uses service role key to bypass RLS policies
 */
export async function getPublicVehicleBySlug(vehicleSlug: string): Promise<{
  id: string
  nickname: string | null
  privacy: string
  owner_id: string
  [key: string]: unknown
} | null> {
  const supabase = createAdminClient()
  const isLikelyUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vehicleSlug)

  const selectClause = `
    *,
    vehicle_data ( * )
  `

  // Try by nickname first (most common case)
  if (!isLikelyUUID) {
    const { data: vehicle, error } = await supabase
      .from('user_vehicle')
      .select(selectClause)
      .eq('privacy', 'PUBLIC')
      .eq('nickname', vehicleSlug)
      .maybeSingle()

    if (vehicle && !error) {
      return vehicle
    }
  }

  // Try by ID if slug looks like UUID
  if (isLikelyUUID) {
    const { data: vehicle, error } = await supabase
      .from('user_vehicle')
      .select(selectClause)
      .eq('privacy', 'PUBLIC')
      .eq('id', vehicleSlug)
      .maybeSingle()

    if (vehicle && !error) {
      return vehicle
    }
  }

  return null
}

