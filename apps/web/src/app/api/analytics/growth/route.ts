import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics/growth?days=30
 *
 * Returns growth KPIs for the admin console.
 * Requires admin role (vanguard plan or admin role on user_profile).
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin access
    const { data: profile } = await supabase
      .from('user_profile')
      .select('role, plan')
      .eq('user_id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.plan !== 'vanguard')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get days parameter
    const days = parseInt(request.nextUrl.searchParams.get('days') || '30', 10)

    // Call the RPC function
    const admin = createAdminClient()
    const { data, error } = await admin.rpc('get_growth_metrics', {
      days_back: days,
    })

    if (error) {
      console.error('[Analytics/Growth] RPC error:', error)
      return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[Analytics/Growth] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
