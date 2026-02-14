import { SupabaseClient } from '@supabase/supabase-js'

export async function updateServiceInterval(
  supabase: SupabaseClient,
  serviceIntervalId: string,
  vehicleId: string,
  logOdometer: number | null,
  logEventDate: string
) {
  try {
    // 1. Fetch the service interval details
    const { data: interval, error: intervalError } = await supabase
      .from('service_intervals')
      .select('interval_months, interval_miles')
      .eq('id', serviceIntervalId)
      .single()

    if (intervalError) throw new Error(`Failed to fetch service interval: ${intervalError.message}`)
    if (!interval) return // Interval not found, maybe a custom log, exit gracefully

    // 2. Determine the current odometer reading
    let currentOdometer = logOdometer
    if (currentOdometer === null) {
      const { data: vehicle, error: vehicleError } = await supabase
        .from('user_vehicle')
        .select('odometer')
        .eq('id', vehicleId)
        .single()
      
      if (vehicleError) throw new Error(`Failed to fetch vehicle data: ${vehicleError.message}`)
      currentOdometer = vehicle?.odometer || 0
    }

    // 3. Calculate next due date and miles
    let nextDueDate: string | null = null
    if (interval.interval_months) {
      const eventDate = new Date(logEventDate)
      eventDate.setMonth(eventDate.getMonth() + interval.interval_months)
      nextDueDate = eventDate.toISOString()
    }

    const nextDueMiles = interval.interval_miles
      ? currentOdometer + interval.interval_miles
      : null

    // 4. Update the service interval
    const { error: updateError } = await supabase
      .from('service_intervals')
      .update({
        due_date: nextDueDate,
        due_miles: nextDueMiles,
      })
      .eq('id', serviceIntervalId)

    if (updateError) {
      throw new Error(`Failed to update service interval: ${updateError.message}`)
    }

  } catch (error) {
    console.error('Error updating service interval:', error)
    // Depending on requirements, you might want to handle this error more gracefully
    // For now, we're logging it. The main log entry was already created.
  }
}
