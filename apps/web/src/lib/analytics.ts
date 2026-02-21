import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Growth event types tracked for conversion/retention KPIs.
 *
 * signup           — new user registered
 * vehicle_added    — user added a vehicle to their garage
 * maintenance_logged — user logged a maintenance entry
 * fuel_logged      — user logged a fuel entry
 * mod_logged       — user logged a mod
 * scan_completed   — user completed an OCR scan
 * onboarding_completed — user finished onboarding wizard
 * return_visit     — user returned after 24h+ absence
 */
export type GrowthEventType =
  | 'signup'
  | 'vehicle_added'
  | 'maintenance_logged'
  | 'fuel_logged'
  | 'mod_logged'
  | 'scan_completed'
  | 'onboarding_completed'
  | 'return_visit'

/**
 * Track a growth event. Fire-and-forget — failures are logged but don't throw.
 * Uses admin client (service role) so it bypasses RLS.
 */
export async function trackGrowthEvent(
  eventType: GrowthEventType,
  userId: string | null,
  eventData?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase.from('growth_events').insert({
      event_type: eventType,
      user_id: userId,
      event_data: eventData || {},
    })

    if (error) {
      console.error(`[Analytics] Failed to track ${eventType}:`, error.message)
    }
  } catch (err) {
    // Fire and forget — never break the main flow
    console.error(`[Analytics] Exception tracking ${eventType}:`, err)
  }
}
