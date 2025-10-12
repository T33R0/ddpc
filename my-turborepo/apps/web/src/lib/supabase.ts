import { createClient } from '@supabase/supabase-js'
import type { Vehicle, VehicleSummary, VehicleTrim } from '@repo/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// API functions to fetch vehicle data from v_vehicle_discovery view
export type VehicleSummaryFilters = {
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

type VehicleSummaryRow = {
  year: number | string
  make: string
  model: string
  trims: VehicleTrim[] | null
}

function mapSummaryRow(row: VehicleSummaryRow): VehicleSummary {
  const trims = (row.trims || []).filter((trim): trim is VehicleTrim => Boolean(trim && trim.id))
  const normalizedTrims = trims.map((trim) => ({
    ...trim,
    imageUrl: trim.imageUrl ?? null,
    fuelType: trim.fuelType ?? null,
    driveType: trim.driveType ?? null,
    bodyType: trim.bodyType ?? null,
    doors: trim.doors ?? null,
    cylinders: trim.cylinders ? String(trim.cylinders) : trim.cylinders ?? null,
  }))
  const heroImage = normalizedTrims.find((trim) => !!trim.imageUrl)?.imageUrl ?? null
  const year = typeof row.year === 'string' ? parseInt(row.year, 10) : row.year

  return {
    year: year || 0,
    make: row.make,
    model: row.model,
    heroImage,
    trims: normalizedTrims,
  }
}

export async function fetchVehicleSummaries({
  limit,
  offset,
  filters,
}: {
  limit: number
  offset: number
  filters?: VehicleSummaryFilters
}): Promise<VehicleSummary[]> {
  if (limit <= 0) {
    throw new Error('Limit must be greater than zero');
  }

  const rangeEnd = offset + limit - 1

  let query = supabase
    .from('v_vehicle_discovery')
    .select(
      `
        year,
        make,
        model,
        trims:json_agg(
          json_build_object(
            'id', id,
            'trim', trim,
            'imageUrl', image_url,
            'fuelType', fuel_type,
            'driveType', drive_type,
            'cylinders', cylinders,
            'bodyType', body_type,
            'doors', doors
          )
        )
      `
    )
    .gte('year', 1990)
    .order('year', { ascending: false })
    .order('make', { ascending: true })
    .order('model', { ascending: true })
    .range(offset, rangeEnd)

  if (filters?.minYear) {
    query = query.gte('year', Math.max(filters.minYear, 1990))
  }

  if (filters?.maxYear) {
    query = query.lte('year', filters.maxYear)
  }

  if (filters?.make) {
    query = query.eq('make', filters.make)
  }

  if (filters?.model) {
    query = query.eq('model', filters.model)
  }

  if (filters?.engineType) {
    query = query.eq('cylinders', filters.engineType)
  }

  if (filters?.fuelType) {
    query = query.eq('fuel_type', filters.fuelType)
  }

  if (filters?.drivetrain) {
    query = query.eq('drive_type', filters.drivetrain)
  }

  if (filters?.doors) {
    query = query.eq('doors', filters.doors)
  }

  if (filters?.vehicleType) {
    query = query.eq('body_type', filters.vehicleType)
  }

  const { data, error } = await query.returns<VehicleSummaryRow[]>()

  if (error) {
    console.error('Error fetching vehicle summaries:', error)
    throw new Error(`Failed to fetch vehicle summaries: ${error.message}`)
  }

  return (data || []).map(mapSummaryRow)
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
