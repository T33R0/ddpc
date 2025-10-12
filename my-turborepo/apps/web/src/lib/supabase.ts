import { createClient } from '@supabase/supabase-js'
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js'
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

type TrimRow = {
  id: string | null
  year: number | string
  make: string
  model: string
  trim: string | null
  image_url: string | null
  fuel_type: string | null
  drive_type: string | null
  cylinders: string | null
  body_type: string | null
  doors: string | null
}

function mapTrimRow(row: TrimRow): VehicleTrim | null {
  if (!row.id || !row.trim) {
    return null
  }

  return {
    id: row.id,
    trim: row.trim,
    imageUrl: row.image_url ?? null,
    fuelType: row.fuel_type ?? null,
    driveType: row.drive_type ?? null,
    cylinders: row.cylinders ? String(row.cylinders) : null,
    bodyType: row.body_type ?? null,
    doors: row.doors ?? null,
  }
}

type VehicleSummaryRow = {
  year: number | string
  make: string
  model: string
  trims: VehicleTrim[]
}

type SummaryFilterQuery = PostgrestFilterBuilder<
  any,
  any,
  Record<string, unknown>,
  any,
  any,
  any,
  any
>

function mapSummaryRow(row: VehicleSummaryRow): VehicleSummary {
  const heroImage = row.trims.find((trim) => !!trim.imageUrl)?.imageUrl ?? null
  const year = typeof row.year === 'string' ? parseInt(row.year, 10) : row.year

  return {
    year: year || 0,
    make: row.make,
    model: row.model,
    heroImage,
    trims: row.trims,
  }
}

function applyVehicleFilters<T extends SummaryFilterQuery>(
  query: T,
  filters?: VehicleSummaryFilters
): T {
  const minYear = filters?.minYear ? Math.max(filters.minYear, 1990) : 1990

  let updatedQuery = query.gte('year', minYear)

  if (filters?.maxYear) {
    updatedQuery = updatedQuery.lte('year', filters.maxYear)
  }

  if (filters?.make) {
    updatedQuery = updatedQuery.eq('make', filters.make)
  }

  if (filters?.model) {
    updatedQuery = updatedQuery.eq('model', filters.model)
  }

  if (filters?.engineType) {
    updatedQuery = updatedQuery.eq('cylinders', filters.engineType)
  }

  if (filters?.fuelType) {
    updatedQuery = updatedQuery.eq('fuel_type', filters.fuelType)
  }

  if (filters?.drivetrain) {
    updatedQuery = updatedQuery.eq('drive_type', filters.drivetrain)
  }

  if (filters?.doors) {
    updatedQuery = updatedQuery.eq('doors', filters.doors)
  }

  if (filters?.vehicleType) {
    updatedQuery = updatedQuery.eq('body_type', filters.vehicleType)
  }

  return updatedQuery
}

function createVehicleKey(year: number | string, make: string, model: string): string {
  const parsedYear = typeof year === 'string' ? parseInt(year, 10) : year
  const safeYear = Number.isFinite(parsedYear) ? parsedYear : year
  return `${safeYear}::${make}::${model}`
}

function escapeFilterValue(value: string | number): string {
  if (typeof value === 'number') {
    return `${value}`
  }

  const escaped = value.replace(/"/g, '\\"')
  return `"${escaped}"`
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

  const baseQuery = applyVehicleFilters(
    supabase.from('v_vehicle_discovery').select('distinct year,make,model'),
    filters
  )
    .order('year', { ascending: false })
    .order('make', { ascending: true })
    .order('model', { ascending: true })
    .range(offset, rangeEnd)

  const { data: summaryRows, error: summaryError } = await baseQuery.returns<
    { year: number | string; make: string; model: string }[]
  >()

  if (summaryError) {
    console.error('Error fetching vehicle summary groups:', summaryError)
    throw new Error(`Failed to fetch vehicle summaries: ${summaryError.message}`)
  }

  if (!summaryRows || summaryRows.length === 0) {
    return []
  }

  const orFilters = summaryRows
    .map((row) => {
      const year = typeof row.year === 'string' ? parseInt(row.year, 10) : row.year

      if (!year || !row.make || !row.model) {
        return null
      }

      const yearValue = Number.isFinite(year) ? Number(year) : row.year
      return `and(year.eq.${yearValue},make.eq.${escapeFilterValue(row.make)},model.eq.${escapeFilterValue(row.model)})`
    })
    .filter((value): value is string => Boolean(value))

  if (orFilters.length === 0) {
    return []
  }

  const trimQuery = applyVehicleFilters(
    supabase
      .from('v_vehicle_discovery')
      .select(
        `
          id,
          year,
          make,
          model,
          trim,
          image_url,
          fuel_type,
          drive_type,
          cylinders,
          body_type,
          doors
        `
      ),
    filters
  ).or(orFilters.join(','))

  const { data: trimRows, error: trimError } = await trimQuery.returns<TrimRow[]>()

  if (trimError) {
    console.error('Error fetching vehicle trim details:', trimError)
    throw new Error(`Failed to fetch vehicle summaries: ${trimError.message}`)
  }

  const trimsByKey = new Map<string, VehicleTrim[]>()

  for (const row of trimRows ?? []) {
    const key = createVehicleKey(row.year, row.make, row.model)
    const normalizedTrim = mapTrimRow(row)

    if (!normalizedTrim) {
      continue
    }

    if (!trimsByKey.has(key)) {
      trimsByKey.set(key, [])
    }

    trimsByKey.get(key)!.push(normalizedTrim)
  }

  return summaryRows.map((row) => {
    const key = createVehicleKey(row.year, row.make, row.model)
    const trims = trimsByKey.get(key) ?? []

    return mapSummaryRow({
      year: row.year,
      make: row.make,
      model: row.model,
      trims,
    })
  })
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
