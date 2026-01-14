'use server'

import { createClient } from '@/lib/supabase/server'

export interface VehicleEvent {
  id: string
  date: Date
  title: string
  description: string
  type: 'maintenance' | 'modification' | 'mileage' | 'fuel'
  cost?: number
  odometer?: number
  status?: string
  event_date?: Date // For mods table
  service_provider?: string // Added for detailed view
}

export async function getVehicleEvents(vehicleId: string): Promise<VehicleEvent[]> {
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  // Verify the vehicle belongs to the user
  const { data: vehicle, error: vehicleError } = await supabase
    .from('user_vehicle')
    .select('id')
    .eq('id', vehicleId)
    .eq('owner_id', user.id)
    .single()

  if (vehicleError || !vehicle) {
    throw new Error('Vehicle not found or access denied')
  }

  // Fetch all data in parallel to avoid waterfalls
  const [maintenanceResult, modsResult, odometerResult, fuelResult] = await Promise.all([
    // Fetch maintenance logs
    supabase
      .from('maintenance_log')
      .select(`
        id,
        cost,
        odometer,
        event_date,
        notes,
        service_provider,
        service_items (
          name
        )
      `)
      .eq('user_vehicle_id', vehicleId)
      .order('event_date', { ascending: false }),

    // Fetch mods
    supabase
      .from('mods')
      .select(`
        id,
        cost,
        odometer,
        event_date,
        status,
        created_at,
        notes,
        mod_items (
          name,
          description
        )
      `)
      .eq('user_vehicle_id', vehicleId)
      .order('event_date', { ascending: false }),

    // Fetch odometer logs
    supabase
      .from('odometer_log')
      .select('id, reading_mi, recorded_at, event_date')
      .eq('user_vehicle_id', vehicleId)
      .order('recorded_at', { ascending: false }),

    // Fetch fuel logs
    supabase
      .from('fuel_log')
      .select('id, event_date, odometer, gallons, price_per_gallon, total_cost, mpg')
      .eq('user_vehicle_id', vehicleId)
      .order('event_date', { ascending: false })
  ]);

  const { data: maintenanceLogs, error: maintenanceError } = maintenanceResult;
  const { data: mods, error: modsError } = modsResult;
  const { data: odometerLogs, error: odometerError } = odometerResult;
  const { data: fuelLogs, error: fuelError } = fuelResult;

  if (maintenanceError) {
    console.error('Error fetching maintenance logs:', maintenanceError)
    throw new Error('Failed to fetch maintenance data')
  }

  if (modsError) {
    console.error('Error fetching mods:', modsError)
    throw new Error('Failed to fetch modifications data')
  }

  if (odometerError) {
    console.error('Error fetching odometer logs:', odometerError)
    throw new Error('Failed to fetch mileage data')
  }

  if (fuelError) {
    console.error('Error fetching fuel logs:', fuelError)
    // Don't fail the whole request for fuel logs, just log error
  }

  // Transform and merge events
  const events: VehicleEvent[] = []

  // Add maintenance events
  if (maintenanceLogs) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    maintenanceLogs.forEach((log: any) => {
      const serviceItemName = Array.isArray(log.service_items)
        ? log.service_items[0]?.name
        : log.service_items?.name

      events.push({
        id: `maintenance-${log.id}`,
        date: new Date(log.event_date),
        title: serviceItemName || 'Maintenance Service',
        description: log.notes || '', // Notes are description
        type: 'maintenance',
        cost: log.cost || undefined,
        odometer: log.odometer || undefined,
        service_provider: log.service_provider, // Explicitly mapped
      })
    })
  }

  // Add modification events
  if (mods) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mods.forEach((mod: any) => {
      const eventDate = mod.event_date ? new Date(mod.event_date) : new Date(mod.created_at)
      const modItemName = Array.isArray(mod.mod_items)
        ? mod.mod_items[0]?.name
        : mod.mod_items?.name
      const modItemDesc = Array.isArray(mod.mod_items)
        ? mod.mod_items[0]?.description
        : mod.mod_items?.description

      events.push({
        id: `mod-${mod.id}`,
        date: eventDate,
        title: modItemName || 'Vehicle Modification',
        description: mod.notes || modItemDesc || '',
        type: 'modification',
        cost: mod.cost || undefined,
        odometer: mod.odometer || undefined,
        status: mod.status,
        event_date: mod.event_date ? new Date(mod.event_date) : undefined,
      })
    })
  }

  // Add fuel events
  if (fuelLogs) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fuelLogs.forEach((log: any) => {
      events.push({
        id: `fuel-${log.id}`,
        // Parse date manually to avoid timezone shifting
        date: new Date(
          parseInt(log.event_date.split('-')[0]),
          parseInt(log.event_date.split('-')[1]) - 1,
          parseInt(log.event_date.split('-')[2])
        ),
        title: `Fuel Up: ${log.gallons} gal`,
        description: log.mpg ? `${log.mpg.toFixed(1)} MPG` : 'Fuel log',
        type: 'fuel',
        cost: log.total_cost || undefined,
        odometer: log.odometer || undefined,
      })
    })
  }

  // Add odometer/mileage events (limit to significant changes to avoid spam)
  if (odometerLogs && odometerLogs.length > 1) {
    // Sort by date and filter to show only significant mileage updates
    const sortedLogs = odometerLogs.sort((a, b) =>
      new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    )

    let lastMileage = 0
    sortedLogs.forEach((log, index) => {
      const currentMileage = log.reading_mi
      const mileageDiff = currentMileage - lastMileage

      // Only include if it's a significant change (> 100 miles) or the first/last reading
      if (index === 0 || index === sortedLogs.length - 1 || mileageDiff > 100) {
        events.push({
          id: `mileage-${log.id}`,
          date: new Date(log.recorded_at),
          title: `Mileage Update: ${currentMileage.toLocaleString()} miles`,
          description: index === 0 ? 'Initial mileage reading' : `Added ${mileageDiff.toLocaleString()} miles`,
          type: 'mileage',
          odometer: currentMileage,
        })
        lastMileage = currentMileage
      }
    })
  }

  // Sort all events by date (descending - most recent first)
  events.sort((a, b) => b.date.getTime() - a.date.getTime())

  return events
}
