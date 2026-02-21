import { createAdminClient } from '@/lib/supabase/admin'
import { User } from '@repo/types'

/**
 * Fetches a user profile by username.
 * Returns null if the user does not exist.
 * Privacy checks must be handled by the caller.
 */
export async function getUserProfileByUsername(username: string): Promise<User | null> {
  const supabase = createAdminClient()

  // Normalize username handling - try exact match or case insensitive
  const { data, error } = await supabase
    .from('user_profile')
    .select('*')
    .ilike('username', username)
    .maybeSingle()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  if (!data) return null

  // Map snake_case database fields to camelCase User interface
  // Sensitive fields (email, plan, banned, stripe_customer_id) are intentionally omitted
  return {
    id: data.user_id || data.id, // Handle potential schema variations
    username: data.username,
    avatarUrl: data.avatar_url,
    displayName: data.display_name,
    location: data.location,
    website: data.website,
    bio: data.bio,
    isPublic: data.is_public,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    role: data.role,
  } as User
}

interface GetProfileVehiclesOptions {
  includePrivate?: boolean
}

/**
 * Fetches vehicles for a specific user profile.
 * By default only returns PUBLIC vehicles unless includePrivate is true.
 */
export async function getProfileVehicles(ownerId: string, options: GetProfileVehiclesOptions = {}): Promise<any[]> {
  const supabase = createAdminClient()
  const { includePrivate = false } = options

  // Select user_vehicle joined with vehicle_data
  let query = supabase
    .from('user_vehicle')
    .select(`
      *,
      vehicle_data (*)
    `)
    .eq('owner_id', ownerId)

  if (!includePrivate) {
    query = query.eq('privacy', 'PUBLIC')
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching profile vehicles:', error)
    return []
  }

  return data || []
}

// Legacy alias for backward compatibility if needed, though we will update usages
export const getPublicUserVehicles = (ownerId: string) => getProfileVehicles(ownerId, { includePrivate: false })
