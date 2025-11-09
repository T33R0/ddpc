import { SupabaseClient } from '@supabase/supabase-js'

export async function seedMaintenancePlan(
  supabase: SupabaseClient,
  userVehicleId: string,
  stockDataId: string
) {
  try {
    // 1. Get the owner_id from the user_vehicle that was just created
    const { data: vehicle, error: vehicleError } = await supabase
      .from('user_vehicle')
      .select('owner_id')
      .eq('id', userVehicleId)
      .single()

    if (vehicleError) throw vehicleError
    if (!vehicle) throw new Error('Vehicle not found')

    const userId = vehicle.owner_id

    // 2. Fetch all master service schedules for the given stock vehicle ID
    const { data: masterSchedules, error: masterScheduleError } = await supabase
      .from('master_service_schedule')
      .select('*')
      .eq('vehicle_data_id', stockDataId)

    if (masterScheduleError) {
      console.error('Error fetching master schedules:', masterScheduleError)
      throw masterScheduleError
    }

    if (!masterSchedules || masterSchedules.length === 0) {
      console.log(`No master service schedule found for vehicle_data_id: ${stockDataId}`)
      return // No plan to seed, so we can exit gracefully
    }

    // 3. For each master schedule, create a new entry in the user's service_intervals
    const newServiceIntervals = masterSchedules.map((schedule) => ({
      user_id: userId,
      user_vehicle_id: userVehicleId,
      master_service_schedule_id: schedule.id,
      name: schedule.name,
      description: schedule.description,
      interval_miles: schedule.interval_miles,
      interval_months: schedule.interval_months,
      // due_date and due_miles will be calculated later
    }))

    const { error: insertError } = await supabase
      .from('service_intervals')
      .insert(newServiceIntervals)

    if (insertError) {
      console.error('Error seeding service intervals:', insertError)
      throw insertError
    }

    console.log(`Successfully seeded ${newServiceIntervals.length} service intervals for user_vehicle_id: ${userVehicleId}`)
  } catch (error) {
    console.error('An unexpected error occurred in seedMaintenancePlan:', error)
    // Decide if you want to re-throw the error or handle it
  }
}

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

    console.log(`Service interval ${serviceIntervalId} updated successfully.`)

  } catch (error) {
    console.error('Error updating service interval:', error)
    // Depending on requirements, you might want to handle this error more gracefully
    // For now, we're logging it. The main log entry was already created.
  }
}
