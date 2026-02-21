import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { trackGrowthEvent } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

/**
 * POST /api/analytics/heartbeat
 *
 * Called by the client on authenticated page loads.
 * Tracks return visits: if user's last heartbeat was >24h ago,
 * logs a return_visit event.
 *
 * Uses a lightweight approach: checks last growth_event for this user
 * rather than maintaining separate state.
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ tracked: false }, { status: 401 })
    }

    // Check if user has any activity in the last 24 hours
    // Use admin client for growth_events (RLS blocks authenticated users)
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const admin = createAdminClient()

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: recentEvent } = await admin
      .from('growth_events')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', twentyFourHoursAgo)
      .limit(1)
      .maybeSingle()

    if (!recentEvent) {
      // No activity in 24h — this is a return visit
      await trackGrowthEvent('return_visit', user.id)
      return NextResponse.json({ tracked: true })
    }

    return NextResponse.json({ tracked: false })
  } catch (error) {
    console.error('[Analytics/Heartbeat] Error:', error)
    return NextResponse.json({ tracked: false }, { status: 500 })
  }
}
