import { createClient } from '@supabase/supabase-js'
import type { Vehicle, VehicleSummary } from '@repo/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

type VehicleSummaryResponse = {
  data: VehicleSummary[]
  page: number
  pageSize: number
  total: number
}

export async function getVehicleSummaries(page = 1, pageSize = 24): Promise<VehicleSummary[]> {
  const searchParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  })

  const response = await fetch(`/api/discover/vehicles?${searchParams.toString()}`, {
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
