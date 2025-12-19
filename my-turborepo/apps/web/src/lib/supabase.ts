import { createBrowserClient } from '@supabase/ssr'
import type { Vehicle, VehicleSummary } from '@repo/types'
import type { SupabaseFilter, FilterOptions } from '../features/explore/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

type VehicleSummaryResponse = {
  data: VehicleSummary[]
  page: number
  pageSize: number
}

export async function getVehicleSummaries(
  page = 1,
  pageSize = 24,
  filters: SupabaseFilter[] = []
): Promise<VehicleSummary[]> {
  const searchParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  })

  // Add filters as JSON string
  if (filters.length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
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
