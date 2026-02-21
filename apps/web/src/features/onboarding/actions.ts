'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export type OnboardingActionResponse = {
  success: boolean
  error?: string
  data?: Record<string, unknown>
}

/**
 * Log a quick oil change entry during onboarding.
 * Finds the "Oil Change" service item, inserts a maintenance_log,
 * and updates the vehicle's odometer.
 */
export async function logQuickService(
  vehicleId: string,
  eventDate: string,
  odometer: number,
  cost?: number
): Promise<OnboardingActionResponse> {
  const schema = z.object({
    vehicleId: z.string().uuid(),
    eventDate: z.string().min(1),
    odometer: z.coerce.number().min(0),
    cost: z.coerce.number().min(0).optional(),
  })

  const parse = schema.safeParse({ vehicleId, eventDate, odometer, cost })
  if (!parse.success) {
    return { success: false, error: 'Invalid input data' }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    // Find "Oil Change" service item
    const { data: serviceItem } = await supabase
      .from('service_items')
      .select('id')
      .ilike('name', '%oil change%')
      .limit(1)
      .maybeSingle()

    // Insert maintenance log
    const { data: log, error: logError } = await supabase
      .from('maintenance_log')
      .insert({
        user_vehicle_id: vehicleId,
        service_item_id: serviceItem?.id || null,
        event_date: eventDate,
        odometer,
        cost: cost || null,
        status: 'History',
        notes: 'Logged during onboarding',
      })
      .select('id')
      .single()

    if (logError) {
      console.error('[logQuickService] Insert error:', logError)
      return { success: false, error: logError.message }
    }

    // Update vehicle odometer
    await supabase
      .from('user_vehicle')
      .update({ odometer })
      .eq('id', vehicleId)
      .eq('owner_id', user.id)

    return { success: true, data: { logId: log.id } }
  } catch (error) {
    console.error('[logQuickService] Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Set a quick service reminder for the next oil change.
 * Finds or creates a service_interval for "Oil Change" on this vehicle,
 * then sets due_miles and due_date based on user input.
 */
export async function setQuickReminder(
  vehicleId: string,
  currentOdometer: number,
  milesUntilDue: number,
  monthsUntilDue: number
): Promise<OnboardingActionResponse> {
  const schema = z.object({
    vehicleId: z.string().uuid(),
    currentOdometer: z.coerce.number().min(0),
    milesUntilDue: z.coerce.number().min(0),
    monthsUntilDue: z.coerce.number().min(0),
  })

  const parse = schema.safeParse({ vehicleId, currentOdometer, milesUntilDue, monthsUntilDue })
  if (!parse.success) {
    return { success: false, error: 'Invalid input data' }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const dueMiles = currentOdometer + milesUntilDue
    const dueDate = new Date()
    dueDate.setMonth(dueDate.getMonth() + monthsUntilDue)

    // Find existing oil change interval for this vehicle
    const { data: existingInterval } = await supabase
      .from('service_intervals')
      .select('id')
      .eq('user_vehicle_id', vehicleId)
      .eq('user_id', user.id)
      .ilike('name', '%oil change%')
      .limit(1)
      .maybeSingle()

    if (existingInterval) {
      // Update existing interval
      const { error: updateError } = await supabase
        .from('service_intervals')
        .update({
          due_miles: dueMiles,
          due_date: dueDate.toISOString(),
          interval_miles: milesUntilDue,
          interval_months: monthsUntilDue,
        })
        .eq('id', existingInterval.id)

      if (updateError) {
        console.error('[setQuickReminder] Update error:', updateError)
        return { success: false, error: updateError.message }
      }

      return { success: true, data: { intervalId: existingInterval.id } }
    } else {
      // Create new interval
      const { data: newInterval, error: insertError } = await supabase
        .from('service_intervals')
        .insert({
          user_id: user.id,
          user_vehicle_id: vehicleId,
          name: 'Oil Change',
          due_miles: dueMiles,
          due_date: dueDate.toISOString(),
          interval_miles: milesUntilDue,
          interval_months: monthsUntilDue,
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('[setQuickReminder] Insert error:', insertError)
        return { success: false, error: insertError.message }
      }

      return { success: true, data: { intervalId: newInterval.id } }
    }
  } catch (error) {
    console.error('[setQuickReminder] Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Mark the user's onboarding as complete.
 * Sets onboarding_completed=true on user_profile.
 */
export async function markOnboardingComplete(): Promise<OnboardingActionResponse> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const { error } = await supabase
      .from('user_profile')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (error) {
      console.error('[markOnboardingComplete] Update error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/garage')
    return { success: true }
  } catch (error) {
    console.error('[markOnboardingComplete] Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
