import { createClient } from '@supabase/supabase-js'
import type { Vehicle } from '@repo/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// API functions to fetch vehicle data from v_vehicle_discovery view
export async function getVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('v_vehicle_discovery')
    .select('*')
    .order('year', { ascending: false })

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
