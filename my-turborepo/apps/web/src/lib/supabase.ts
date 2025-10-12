import { createClient } from '@supabase/supabase-js'
import type { Vehicle } from '@repo/types'

export type VehicleQueryFilters = {
  minYear?: number | null
  maxYear?: number | null
  make?: string | null
  model?: string | null
  engineType?: string | null
  fuelType?: string | null
  drivetrain?: string | null
  doors?: string | null
  vehicleType?: string | null
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

type VehicleQueryOptions = {
  limit: number
  offset: number
  filters?: VehicleQueryFilters
}

// API functions to fetch vehicle data from v_vehicle_discovery view
export async function getVehicles({
  limit,
  offset,
  filters,
}: VehicleQueryOptions): Promise<Vehicle[]> {
  let query = supabase
    .from('v_vehicle_discovery')
    .select('*')
    .gte('year', '1990')
    .order('year', { ascending: false })
    .range(offset, offset + limit - 1)

  if (filters?.minYear) {
    query = query.gte('year', filters.minYear.toString())
  }

  if (filters?.maxYear) {
    query = query.lte('year', filters.maxYear.toString())
  }

  if (filters?.make) {
    query = query.eq('make', filters.make)
  }

  if (filters?.model) {
    query = query.eq('model', filters.model)
  }

  if (filters?.engineType) {
    const engineValue = Number(filters.engineType)
    query = query.eq('cylinders', Number.isNaN(engineValue) ? filters.engineType : engineValue)
  }

  if (filters?.fuelType) {
    query = query.eq('fuel_type', filters.fuelType)
  }

  if (filters?.drivetrain) {
    query = query.eq('drive_type', filters.drivetrain)
  }

  if (filters?.doors) {
    query = query.eq('body_type', filters.doors)
  }

  if (filters?.vehicleType) {
    query = query.eq('body_type', filters.vehicleType)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching vehicles:', error)
    throw new Error(`Failed to fetch vehicles: ${error.message}`)
  }

  return (data || []) as Vehicle[]
}

export async function getVehicleById(id: string): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from('v_vehicle_discovery')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching vehicle:', error)
    throw new Error(`Failed to fetch vehicle: ${error.message}`)
  }

  return data as Vehicle
}

// Note: addVehicleToGarage is now implemented as an API route
// in /api/garage/add-vehicle for better error handling and security
