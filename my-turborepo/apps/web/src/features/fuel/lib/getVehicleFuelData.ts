import { createClient } from '@/lib/supabase/server'

export interface FuelEntry {
  id: string
  date: Date
  gallons: number
  cost?: number
  odometer: number
  mpg?: number // calculated field
  trip_miles?: number
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
    odometer?: number | null
    nickname?: string | null // Actual nickname for URL generation
  }
  fuelEntries: FuelEntry[]
  stats: FuelStats
  hasData: boolean
}

// Helper function to check if a string is a UUID
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export async function getVehicleFuelData(vehicleSlug: string): Promise<VehicleFuelData> {
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  // Decode the slug in case it's URL encoded
  const decodedSlug = decodeURIComponent(vehicleSlug)
  
  // Determine if this looks like a UUID or a nickname
  const isLikelyUUID = isUUID(decodedSlug)

  let vehicle
  let vehicleError

  // If it looks like a UUID, try ID first, otherwise try nickname first
  if (isLikelyUUID) {
    // Try by ID first
    const { data: vehicleById, error: idError } = await supabase
      .from('user_vehicle')
      .select('id, nickname, year, make, model, fuel_type, epa_combined_mpg, odometer')
      .eq('owner_id', user.id)
      .eq('id', decodedSlug)
      .single()

    vehicle = vehicleById
    vehicleError = idError

    // If not found by ID, try by nickname (in case UUID matches a nickname somehow)
    if (!vehicle && !vehicleError) {
      const { data: vehicleByNickname, error: nicknameError } = await supabase
        .from('user_vehicle')
        .select('id, nickname, year, make, model, fuel_type, epa_combined_mpg, odometer')
        .eq('owner_id', user.id)
        .eq('nickname', decodedSlug)
        .single()

      vehicle = vehicleByNickname
      vehicleError = nicknameError
    }
  } else {
    // Try by nickname first (only if slug is not empty)
    if (decodedSlug && decodedSlug.trim()) {
      const { data: vehicleByNickname, error: nicknameError } = await supabase
        .from('user_vehicle')
        .select('id, nickname, year, make, model, fuel_type, epa_combined_mpg, odometer')
        .eq('owner_id', user.id)
        .eq('nickname', decodedSlug)
        .single()

      vehicle = vehicleByNickname
      vehicleError = nicknameError
    }

    // If not found by nickname, try by ID (fallback)
    if (!vehicle && !vehicleError) {
      const { data: vehicleById, error: idError } = await supabase
        .from('user_vehicle')
        .select('id, nickname, year, make, model, fuel_type, epa_combined_mpg, odometer')
        .eq('owner_id', user.id)
        .eq('id', decodedSlug)
        .single()

      vehicle = vehicleById
      vehicleError = idError
    }
  }

  if (vehicleError || !vehicle) {
    console.error('getVehicleFuelData: Vehicle lookup failed', {
      vehicleSlug: decodedSlug,
      isLikelyUUID,
      userId: user.id,
      vehicleError: vehicleError?.message,
      hasVehicle: !!vehicle
    })
    throw new Error('Vehicle not found or access denied')
  }

  const vehicleId = vehicle.id

  // Fetch fuel logs from fuel_log table
  const { data: fuelLogs, error: fuelLogsError } = await supabase
    .from('fuel_log')
    .select('id, event_date, odometer, gallons, price_per_gallon, total_cost, trip_miles, mpg')
    .eq('user_vehicle_id', vehicleId)
    .order('event_date', { ascending: true })

  if (fuelLogsError) {
    console.error('Error fetching fuel logs:', fuelLogsError)
    throw new Error('Failed to fetch fuel data')
  }

  const fuelEntries: FuelEntry[] = []
  let totalGallons = 0
  let totalCost = 0

  if (fuelLogs && fuelLogs.length > 0) {
    fuelLogs.forEach((log) => {
      const fuelEntry: FuelEntry = {
        id: log.id,
        date: new Date(log.event_date),
        gallons: log.gallons,
        cost: log.total_cost || undefined,
        odometer: log.odometer,
        mpg: log.mpg || undefined,
        trip_miles: log.trip_miles || undefined,
      }

      fuelEntries.push(fuelEntry)
      totalGallons += log.gallons
      if (log.total_cost) totalCost += log.total_cost
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

  // Build vehicle name
  const vehicleName = vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`
  const ymmt = `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.nickname ? ` (${vehicle.nickname})` : ''}`

  return {
    vehicle: {
      id: vehicle.id,
      name: vehicleName,
      ymmt: ymmt,
      fuelType: vehicle.fuel_type || undefined,
      factoryMpg: vehicle.epa_combined_mpg || undefined,
      odometer: vehicle.odometer || null,
      nickname: vehicle.nickname || null, // Store actual nickname for redirects
    },
    fuelEntries,
    stats,
    hasData: fuelEntries.length > 0,
  }
}
