import { createClient } from '@/lib/supabase/server'

export interface FuelEntry {
  id: string
  date: Date
  gallons: number
  cost?: number
  odometer: number
  mpg?: number // calculated field
}

export interface FuelStats {
  factoryMpg?: number
  averageMpg?: number
  totalGallons: number
  totalCost: number
  fuelCostPerMile?: number
  mpgDifference?: number // factory - actual (positive = better than factory)
}

export interface VehicleFuelData {
  vehicle: {
    id: string
    name: string
    ymmt: string
    fuelType?: string
    factoryMpg?: number
  }
  fuelEntries: FuelEntry[]
  stats: FuelStats
  hasData: boolean
}

export async function getVehicleFuelData(vehicleId: string): Promise<VehicleFuelData> {
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  // Fetch vehicle info with fuel data
  const { data: vehicle, error: vehicleError } = await supabase
    .from('user_vehicle')
    .select('id, name, ymmt, fuel_type, epa_combined_mpg')
    .eq('id', vehicleId)
    .eq('owner_id', user.id)
    .single()

  if (vehicleError || !vehicle) {
    throw new Error('Vehicle not found or access denied')
  }

  // Fetch maintenance logs that might be fuel entries
  // Look for descriptions containing fuel-related keywords
  const fuelKeywords = ['fuel', 'gas', 'gasoline', 'diesel', 'fill', 'refuel', 'pump']
  const { data: maintenanceLogs, error: maintenanceError } = await supabase
    .from('maintenance_log')
    .select('id, description, cost, odometer, event_date, notes')
    .eq('user_vehicle_id', vehicleId)
    .not('odometer', 'is', null) // Must have odometer reading
    .ilike('description', `%${fuelKeywords.join('%')}%`) // Contains fuel keywords
    .order('event_date', { ascending: true })

  if (maintenanceError) {
    console.error('Error fetching maintenance logs:', maintenanceError)
    throw new Error('Failed to fetch maintenance data')
  }

  // For now, we'll work with maintenance logs as fuel entries
  // In a real implementation, there might be a separate fuel_log table
  // For now, let's assume fuel entries are stored as maintenance logs with fuel keywords

  let fuelEntries: FuelEntry[] = []
  let totalGallons = 0
  let totalCost = 0

  if (maintenanceLogs && maintenanceLogs.length > 0) {
    // Sort by date to calculate MPG between entries
    const sortedLogs = maintenanceLogs.sort((a, b) =>
      new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    )

    // Convert maintenance logs to fuel entries
    // For now, we'll use a simplified approach - assuming cost is fuel cost
    // and we'll need gallons data (this might be stored in notes or we'd need a separate field)
    sortedLogs.forEach((log, index) => {
      // Try to extract gallons from notes or description
      // This is a placeholder - real implementation would have gallons field
      let gallons = 0

      // Look for gallon amounts in notes/description (e.g., "10.5 gallons")
      const gallonMatch = (log.notes || log.description || '').match(/(\d+(?:\.\d+)?)\s*(?:gal|gallons?)/i)
      if (gallonMatch) {
        gallons = parseFloat(gallonMatch[1])
      }

      // If no gallons found, skip this entry for MPG calculations
      if (gallons <= 0) return

      const fuelEntry: FuelEntry = {
        id: log.id,
        date: new Date(log.event_date),
        gallons: gallons,
        cost: log.cost || undefined,
        odometer: log.odometer!,
      }

      // Calculate MPG if we have previous entry
      if (index > 0 && sortedLogs[index - 1].odometer && log.odometer) {
        const milesDriven = log.odometer - sortedLogs[index - 1].odometer
        if (milesDriven > 0) {
          fuelEntry.mpg = milesDriven / gallons
        }
      }

      fuelEntries.push(fuelEntry)

      totalGallons += gallons
      if (log.cost) totalCost += log.cost
    })
  }

  // Calculate statistics
  const validMpgEntries = fuelEntries.filter(entry => entry.mpg && entry.mpg > 0)
  const averageMpg = validMpgEntries.length > 0
    ? validMpgEntries.reduce((sum, entry) => sum + (entry.mpg || 0), 0) / validMpgEntries.length
    : undefined

  const fuelCostPerMile = averageMpg && totalCost > 0
    ? totalCost / (totalGallons * averageMpg)
    : undefined

  const mpgDifference = vehicle.epa_combined_mpg && averageMpg
    ? averageMpg - vehicle.epa_combined_mpg
    : undefined

  const stats: FuelStats = {
    factoryMpg: vehicle.epa_combined_mpg || undefined,
    averageMpg,
    totalGallons,
    totalCost,
    fuelCostPerMile,
    mpgDifference,
  }

  return {
    vehicle: {
      id: vehicle.id,
      name: vehicle.name,
      ymmt: vehicle.ymmt,
      fuelType: vehicle.fuel_type || undefined,
      factoryMpg: vehicle.epa_combined_mpg || undefined,
    },
    fuelEntries,
    stats,
    hasData: fuelEntries.length > 0,
  }
}
