'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

const BREAKGLASS_EMAIL = 'myddpc@gmail.com'

export async function getAdminUsers(page = 1, pageSize = 20, query = '') {
  const supabase = await createClient()
  
  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Check admin role
  const { data: profile } = await supabase
    .from('user_profile')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const isBreakglass = user.email === BREAKGLASS_EMAIL
  if (!isBreakglass && profile?.role !== 'admin') {
    throw new Error('Unauthorized access')
  }

  // Try RPC first
  const offset = (page - 1) * pageSize
  const { data, error } = await supabase.rpc('get_admin_users_stats', {
    limit_offset: offset,
    limit_count: pageSize,
    search_query: query || null
  })

  if (error) {
    console.error('RPC Error, falling back to basic fetch:', error)
    // Fallback: fetch profiles and map
    // Note: This fallback won't have auth.users email data unless we use admin client
    // Use admin client for fallback to get emails
    const adminClient = createAdminClient()
    
    const { data: profiles, error: profileError } = await adminClient
      .from('user_profile')
      .select('*')
      .ilike('username', `%${query}%`)
      .range(offset, offset + pageSize - 1)
      .order('created_at', { ascending: false })

    if (profileError) throw profileError

    // Enhance with auth data (slow N+1 but works for fallback)
    const users = await Promise.all(profiles.map(async (p: any) => {
        const { data: { user: authUser } } = await adminClient.auth.admin.getUserById(p.user_id)
        
        // Get vehicle stats
        const { count } = await adminClient
            .from('user_vehicle')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', p.user_id)
            
        // Get status counts
        const { data: vehicles } = await adminClient
            .from('user_vehicle')
            .select('current_status')
            .eq('owner_id', p.user_id)
            
        const statusCounts = vehicles?.reduce((acc: any, v: any) => {
            const s = v.current_status || 'unknown'
            acc[s] = (acc[s] || 0) + 1
            return acc
        }, {}) || {}

        return {
            user_id: p.user_id,
            username: p.username,
            join_date: p.created_at, // Profile creation approx join date
            email: authUser?.email || 'N/A',
            provider: authUser?.app_metadata?.provider || 'email',
            vehicle_count: count || 0,
            status_counts: statusCounts,
            role: p.role,
            banned: p.banned
        }
    }))
    
    return users
  }

  return data
}

export async function toggleUserSuspension(userId: string, shouldSuspend: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')
  
  // Verify admin
  const { data: profile } = await supabase
    .from('user_profile')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (user.email !== BREAKGLASS_EMAIL && profile?.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const adminClient = createAdminClient()
  
  // Update auth ban (ban duration in hours)
  // 876000 hours is ~100 years
  const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
    ban_duration: shouldSuspend ? '876000h' : '0h'
  })
  
  if (authError) {
    console.error('Error suspending auth user:', authError)
    // Continue to update profile even if auth update fails (might be partial success)
  }

  const { error: profileError } = await adminClient
    .from('user_profile')
    .update({ banned: shouldSuspend })
    .eq('user_id', userId)

  if (profileError) throw profileError

  revalidatePath('/admin/users')
}

export async function toggleAdminRole(userId: string, makeAdmin: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || user.email !== BREAKGLASS_EMAIL) {
    throw new Error('Only the breakglass admin can manage administrators')
  }

  const adminClient = createAdminClient()
  
  const { error } = await adminClient
    .from('user_profile')
    .update({ role: makeAdmin ? 'admin' : 'user' })
    .eq('user_id', userId)

  if (error) throw error
  
  revalidatePath('/admin/users')
}



