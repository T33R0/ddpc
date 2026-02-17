'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin, requireBreakglass } from '@/lib/require-admin'

export async function getAdminUsers(page = 1, pageSize = 20, query = '', sortBy = 'joined', sortDir = 'desc') {
  const schema = z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1).max(100),
    query: z.string().max(100).optional(),
    sortBy: z.string().max(50).optional(),
    sortDir: z.string().max(5).optional()
  });

  const parse = schema.safeParse({ page, pageSize, query, sortBy, sortDir });
  if (!parse.success) {
    console.error('Validation error in getAdminUsers:', parse.error);
    throw new Error('Invalid input');
  }

  await requireAdmin()

  const adminClient = createAdminClient()
  const offset = (page - 1) * pageSize
  const { data, error } = await adminClient.rpc('get_admin_users_stats', {
    limit_offset: offset,
    limit_count: pageSize,
    search_query: query || null,
    sort_by: sortBy,
    sort_dir: sortDir
  })

  if (error) {
    console.error('RPC Error, falling back to basic fetch:', JSON.stringify(error, null, 2))
    // Fallback: fetch profiles and map
    const adminClient = createAdminClient()

    let queryBuilder = adminClient
      .from('user_profile')
      .select('*', { count: 'exact' })
      .ilike('username', `%${query}%`)
      .range(offset, offset + pageSize - 1)

    // Basic sorting for fields available on user_profile
    if (sortBy === 'user') {
      queryBuilder = queryBuilder.order('username', { ascending: sortDir === 'asc' })
    } else {
      // Default to created_at (joined) for 'joined' and unsupported sorts in fallback
      queryBuilder = queryBuilder.order('created_at', { ascending: sortDir === 'asc' })
    }

    const { data: profiles, error: profileError, count: totalCount } = await queryBuilder

    if (profileError) throw profileError

    // Enhance with auth data (slow N+1 but works for fallback)
    const users = await Promise.all(profiles.map(async (p: { user_id: string; username: string; created_at: string; role: string; banned: boolean; plan: string | null }) => {
      const { data: { user: authUser } } = await adminClient.auth.admin.getUserById(p.user_id)

      // Get status counts
      const { data: vehicles } = await adminClient
        .from('user_vehicle')
        .select('current_status')
        .eq('owner_id', p.user_id)

      const statusCounts = vehicles?.reduce((acc: Record<string, number>, v: { current_status: string | null }) => {
        const s = v.current_status || 'unknown'
        acc[s] = (acc[s] || 0) + 1
        return acc
      }, {}) || {}

      return {
        user_id: p.user_id,
        username: p.username,
        join_date: p.created_at, // Profile creation approx join date
        email: authUser?.email || 'N/A',
        last_sign_in_at: authUser?.last_sign_in_at || null,
        provider: authUser?.app_metadata?.provider || 'email',
        vehicle_count: vehicles?.length || 0,
        status_counts: statusCounts,
        role: p.role,
        banned: p.banned,
        plan: p.plan || 'free',
        total_count: totalCount || 0
      }
    }))

    return { users, totalCount: totalCount || 0 }
  }

  // Map RPC output columns to User interface
  const mappedUsers = data.map((u: any) => ({
    user_id: u.o_user_id,
    username: u.o_username,
    display_name: u.o_display_name,
    join_date: u.o_join_date,
    email: u.o_email,
    provider: u.o_provider,
    vehicle_count: u.o_vehicle_count,
    status_counts: u.o_status_counts,
    role: u.o_role,
    banned: u.o_banned,
    plan: u.o_plan,
    last_sign_in_at: u.o_last_sign_in_at,
    total_count: u.o_total_count
  }))

  const totalCount = mappedUsers?.[0]?.total_count || 0
  return { users: mappedUsers, totalCount }
}

export async function toggleUserSuspension(userId: string, shouldSuspend: boolean) {
  const schema = z.object({
    userId: z.string().uuid(),
    shouldSuspend: z.boolean()
  });

  const parse = schema.safeParse({ userId, shouldSuspend });
  if (!parse.success) {
    console.error('Validation error in toggleUserSuspension:', parse.error);
    throw new Error('Invalid input');
  }

  await requireAdmin()

  const adminClient = createAdminClient()

  // Update auth ban (876000 hours is ~100 years)
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
  const schema = z.object({
    userId: z.string().uuid(),
    makeAdmin: z.boolean()
  });

  const parse = schema.safeParse({ userId, makeAdmin });
  if (!parse.success) {
    console.error('Validation error in toggleAdminRole:', parse.error);
    throw new Error('Invalid input');
  }

  await requireBreakglass()

  const adminClient = createAdminClient()
  const roleValue = makeAdmin ? 'admin' : 'user'

  try {
    // Try RPC function first
    const { data: rpcData, error: rpcError } = await adminClient.rpc('update_user_role', {
      p_user_id: userId,
      p_role: roleValue
    })

    if (rpcError) {
      console.error('RPC error details:', {
        message: rpcError.message,
        details: rpcError.details,
        hint: rpcError.hint,
        code: rpcError.code
      })

      // Check if RPC function doesn't exist
      if (rpcError.code === '42883' || rpcError.message?.includes('function update_user_role')) {
        console.log('RPC function not found, trying direct update...')

        // Fallback to direct update
        const { data: updateData, error: updateError } = await adminClient
          .from('user_profile')
          .update({ role: roleValue as 'admin' | 'user' })
          .eq('user_id', userId)
          .select()

        if (updateError) {
          console.error('Direct update error:', {
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint,
            code: updateError.code
          })
          throw new Error(`Failed to update admin role: ${updateError.message || updateError.code}`)
        }

        console.log('Direct update succeeded:', updateData)
      } else {
        // RPC function exists but failed - check if it returned an error in the data
        const errorMsg = rpcError.message || rpcError.code || 'Unknown RPC error'
        throw new Error(`Failed to update admin role via RPC: ${errorMsg}`)
      }
    } else {
      // Check if RPC returned an error in the response data
      if (rpcData && typeof rpcData === 'object' && 'success' in rpcData && !rpcData.success) {
        const errorMsg = rpcData.error || rpcData.error_code || 'Unknown error from RPC'
        throw new Error(`Failed to update admin role: ${errorMsg}`)
      }
      console.log('RPC succeeded:', rpcData)
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Unexpected error in toggleAdminRole:', err)
    // Re-throw if it's already our formatted error
    if (err.message && err.message.includes('Failed to update admin role')) {
      throw err
    }
    throw new Error(`Failed to update admin role: ${err.message || 'Unknown error'}`)
  }

  revalidatePath('/admin/users')
}

export async function grantProAccess(userId: string, isPro: boolean) {
  const schema = z.object({
    userId: z.string().uuid(),
    isPro: z.boolean()
  });

  const parse = schema.safeParse({ userId, isPro });
  if (!parse.success) {
    console.error('Validation error in grantProAccess:', parse.error);
    throw new Error('Invalid input');
  }

  await requireAdmin()

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('user_profile')
    .update({ plan: isPro ? 'pro' : 'free' })
    .eq('user_id', userId)

  if (error) throw error

  revalidatePath('/admin/users')
}

export async function getIssueReports(page = 0, pageSize = 50, filter: 'all' | 'unresolved' = 'unresolved') {
  const schema = z.object({
    page: z.number().int().min(0),
    pageSize: z.number().int().min(1).max(100),
    filter: z.enum(['all', 'unresolved'])
  });

  const parse = schema.safeParse({ page, pageSize, filter });
  if (!parse.success) {
    console.error('Validation error in getIssueReports:', parse.error);
    throw new Error('Invalid input');
  }

  await requireAdmin()

  const adminClient = createAdminClient()

  let query = adminClient
    .from('issue_reports')
    .select('id, user_email, page_url, description, screenshot_url, resolved, created_at, admin_notes', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1)

  if (filter === 'unresolved') {
    query = query.eq('resolved', false)
  }

  const { data, error, count } = await query

  if (error) throw error

  return { data, count }
}

export async function toggleIssueResolution(issueId: string, resolved: boolean) {
  const schema = z.object({
    issueId: z.string().uuid(),
    resolved: z.boolean()
  });

  const parse = schema.safeParse({ issueId, resolved });
  if (!parse.success) {
    console.error('Validation error in toggleIssueResolution:', parse.error);
    throw new Error('Invalid input');
  }

  await requireAdmin()

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('issue_reports')
    .update({ resolved })
    .eq('id', issueId)

  if (error) throw error

  revalidatePath('/admin/issues')
}

export async function updateIssueNotes(issueId: string, notes: string) {
  const schema = z.object({
    issueId: z.string().uuid(),
    notes: z.string().max(2000)
  });

  const parse = schema.safeParse({ issueId, notes });
  if (!parse.success) {
    console.error('Validation error in updateIssueNotes:', parse.error);
    throw new Error('Invalid input');
  }

  await requireAdmin()

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('issue_reports')
    .update({ admin_notes: notes })
    .eq('id', issueId)

  if (error) throw error

  revalidatePath('/admin/issues')
}
