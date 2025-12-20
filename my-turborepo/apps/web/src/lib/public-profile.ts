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
 * Fetches a public user profile by username.
 * Returns null if the user does not exist or is not public.
 */
export async function getPublicUserProfile(username: string): Promise<User | null> {
  const supabase = getServiceRoleClient()

  // Normalize username handling - try exact match or case insensitive
  const { data, error } = await supabase
    .from('user_profile')
    .select('*')
    .ilike('username', username)
    .eq('is_public', true)
    .maybeSingle()

  if (error) {
    console.error('Error fetching public user profile:', error)
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

/**
 * Fetches public vehicles for a specific user.
 */
export async function getPublicUserVehicles(ownerId: string): Promise<any[]> {
  const supabase = getServiceRoleClient()

  // Select user_vehicle joined with vehicle_data
  const { data, error } = await supabase
    .from('user_vehicle')
    .select(`
      *,
      vehicle_data (*)
    `)
    .eq('owner_id', ownerId)
    .eq('privacy', 'PUBLIC')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching public user vehicles:', error)
    return []
  }

  return data || []
}
