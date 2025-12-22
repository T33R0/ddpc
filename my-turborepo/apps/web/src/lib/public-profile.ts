import { createClient } from '@supabase/supabase-js'
import { User, Vehicle } from './types'

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
 * Fetches a user profile by username.
 * Returns null if the user does not exist.
 * Privacy checks must be handled by the caller.
 */
export async function getUserProfileByUsername(username: string): Promise<User | null> {
  const supabase = getServiceRoleClient()

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
  return {
    id: data.user_id || data.id, // Handle potential schema variations
    username: data.username,
    email: data.email, // Note: Email might not be returned publicly depending on privacy, but it's in the type
    avatarUrl: data.avatar_url,
    displayName: data.display_name,
    location: data.location,
    website: data.website,
    bio: data.bio,
    isPublic: data.is_public,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    role: data.role,
    plan: data.plan,
    banned: data.banned
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
  const supabase = getServiceRoleClient()
  const { includePrivate = false } = options

  // Select user_vehicle joined with vehicle_data
  let query = supabase
    .from('user_vehicle')
    .select(`
      *,
      vehicle_data (*),
      vehicle_primary_image (url)
    `)
    .eq('owner_id', ownerId)

  if (!includePrivate) {
    query = query.eq('privacy', 'PUBLIC')
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching profile vehicles:', error)
    // Throw error so we know if query fails (e.g. relation missing) instead of silently returning empty
    throw error
  }

  return data || []
}

// Legacy alias for backward compatibility if needed, though we will update usages
export const getPublicUserVehicles = (ownerId: string) => getProfileVehicles(ownerId, { includePrivate: false })
