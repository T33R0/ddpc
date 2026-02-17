import { createClient } from '@/lib/supabase/server'

/**
 * Breakglass email for emergency admin access.
 * Set BREAKGLASS_EMAIL in environment to override.
 * Falls back to myddpc@gmail.com for backwards compatibility.
 */
const BREAKGLASS_EMAIL = process.env.BREAKGLASS_EMAIL ?? 'myddpc@gmail.com'

export function isBreakglassEmail(email: string | undefined): boolean {
  return email === BREAKGLASS_EMAIL
}

/**
 * Verifies the current user is an admin (role='admin' or breakglass email).
 * Throws if unauthorized. Returns the authenticated user and admin client context.
 *
 * Use `requireBreakglass()` for actions that only the breakglass admin can perform
 * (e.g., promoting/demoting other admins).
 */
export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const isBreakglass = isBreakglassEmail(user.email)

  if (!isBreakglass) {
    const { data: profile } = await supabase
      .from('user_profile')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      throw new Error('Unauthorized access')
    }
  }

  return { user, isBreakglass }
}

/**
 * Verifies the current user is the breakglass admin specifically.
 * Use for sensitive operations like managing other admins.
 */
export async function requireBreakglass() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isBreakglassEmail(user.email)) {
    throw new Error('Only the breakglass admin can perform this action')
  }

  return { user }
}
