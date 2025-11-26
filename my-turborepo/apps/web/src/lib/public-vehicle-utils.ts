import { createClient } from '@supabase/supabase-js'

// Create a Supabase client with service role key (bypasses RLS)
function getServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase environment variables are not configured correctly for service role client.')
    throw new Error('Supabase environment variables are not configured.')
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

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
  const supabase = getServiceRoleClient()
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

