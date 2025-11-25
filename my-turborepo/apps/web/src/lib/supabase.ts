import { createBrowserClient } from '@supabase/ssr'
import type { Vehicle, VehicleSummary } from '@repo/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

type VehicleSummaryResponse = {
  data: VehicleSummary[]
  page: number
  pageSize: number
}

type FilterOptions = {
  years: number[]
  makes: string[]
  models: { make: string; model: string }[]
  engineTypes: string[]
  fuelTypes: string[]
  drivetrains: string[]
  bodyTypes: string[]
}

export async function getVehicleSummaries(
  page = 1,
  pageSize = 24,
  filters?: {
    minYear?: number | null;
    maxYear?: number | null;
    make?: string | null;
    model?: string | null;
    engineType?: string | null;
    fuelType?: string | null;
    drivetrain?: string | null;
    vehicleType?: string | null;
    search?: string | null;
  }
): Promise<VehicleSummary[]> {
  const searchParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  })

  // Add filter parameters if provided
  if (filters) {
    if (filters.search) {
      searchParams.set('search', filters.search);
    }
    if (filters.minYear !== null && filters.minYear !== undefined) {
      searchParams.set('minYear', filters.minYear.toString());
    }
    if (filters.maxYear !== null && filters.maxYear !== undefined) {
      searchParams.set('maxYear', filters.maxYear.toString());
    }
    if (filters.make) {
      searchParams.set('make', filters.make);
    }
    if (filters.model) {
      searchParams.set('model', filters.model);
    }
    if (filters.engineType) {
      searchParams.set('engineType', filters.engineType);
    }
    if (filters.fuelType) {
      searchParams.set('fuelType', filters.fuelType);
    }
    if (filters.drivetrain) {
      searchParams.set('drivetrain', filters.drivetrain);
    }
    if (filters.vehicleType) {
      searchParams.set('vehicleType', filters.vehicleType);
    }
  }

  const response = await fetch(`/api/explore/vehicles?${searchParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    const message = (errorBody && errorBody.error) || 'Failed to fetch vehicle summaries'
    throw new Error(message)
  }

  const payload = (await response.json()) as VehicleSummaryResponse
  return payload.data
}

export async function getVehicleFilterOptions(): Promise<FilterOptions> {
  const response = await fetch('/api/explore/filters', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    const message = (errorBody && errorBody.error) || 'Failed to fetch filter options'
    throw new Error(message)
  }

  return await response.json()
}

export async function getVehicleById(id: string): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from('v_vehicle_explore')
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
