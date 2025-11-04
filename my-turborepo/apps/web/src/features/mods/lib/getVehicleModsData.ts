import { createClient } from '@/lib/supabase/server'

export interface ModPart {
  id: string
  name: string
  vendor?: string
  cost?: number
  quantity: number
}

export interface ModOutcome {
  id: string
  success: boolean
  notes?: string
  event_date: Date
}

export interface VehicleMod {
  id: string
  title: string
  description?: string
  status: 'planned' | 'ordered' | 'installed' | 'tuned'
  cost?: number
  odometer?: number
  event_date: Date
  parts: ModPart[]
  outcome?: ModOutcome
}

export interface VehicleModsData {
  vehicle: {
    id: string
    name: string
    ymmt: string
    odometer?: number
  }
  mods: VehicleMod[]
  summary: {
    totalMods: number
    totalCost: number
    inProgressCount: number
    completedCount: number
  }
}

export async function getVehicleModsData(vehicleId: string): Promise<VehicleModsData> {
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  // Fetch vehicle info
  const { data: vehicle, error: vehicleError } = await supabase
    .from('user_vehicle')
    .select('id, name, ymmt, odometer')
    .eq('id', vehicleId)
    .eq('owner_id', user.id)
    .single()

  if (vehicleError || !vehicle) {
    throw new Error('Vehicle not found or access denied')
  }

  // Fetch mods with parts and outcomes
  const { data: modsData, error: modsError } = await supabase
    .from('mods')
    .select(`
      id,
      title,
      description,
      status,
      cost,
      odometer,
      event_date,
      mod_parts (
        id,
        quantity,
        part_inventory (
          id,
          name,
          vendor,
          cost
        )
      ),
      mod_outcome (
        id,
        success,
        notes,
        event_date
      )
    `)
    .eq('user_vehicle_id', vehicleId)
    .order('event_date', { ascending: false })

  if (modsError) {
    console.error('Error fetching mods:', modsError)
    throw new Error('Failed to fetch mods data')
  }

  // Transform the data
  const mods: VehicleMod[] = modsData?.map(mod => ({
    id: mod.id,
    title: mod.title,
    description: mod.description || undefined,
    status: mod.status,
    cost: mod.cost || undefined,
    odometer: mod.odometer || undefined,
    event_date: new Date(mod.event_date),
    parts: mod.mod_parts?.map((mp: any) => ({
      id: mp.part_inventory?.id || mp.id,
      name: mp.part_inventory?.name || 'Unknown Part',
      vendor: mp.part_inventory?.vendor || undefined,
      cost: mp.part_inventory?.cost || undefined,
      quantity: mp.quantity || 1
    })) || [],
    outcome: mod.mod_outcome?.[0] ? {
      id: mod.mod_outcome[0].id,
      success: mod.mod_outcome[0].success,
      notes: mod.mod_outcome[0].notes || undefined,
      event_date: new Date(mod.mod_outcome[0].event_date)
    } : undefined
  })) || []

  // Calculate summary
  const totalMods = mods.length
  const totalCost = mods.reduce((sum, mod) => sum + (mod.cost || 0), 0)
  const inProgressCount = mods.filter(mod =>
    ['planned', 'ordered'].includes(mod.status)
  ).length
  const completedCount = mods.filter(mod =>
    ['installed', 'tuned'].includes(mod.status)
  ).length

  return {
    vehicle: {
      id: vehicle.id,
      name: vehicle.name,
      ymmt: vehicle.ymmt,
      odometer: vehicle.odometer || undefined,
    },
    mods,
    summary: {
      totalMods,
      totalCost,
      inProgressCount,
      completedCount
    }
  }
}
