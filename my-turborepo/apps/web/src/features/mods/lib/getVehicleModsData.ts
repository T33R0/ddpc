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

  // Fetch vehicle info - use correct columns from user_vehicle table
  const { data: vehicle, error: vehicleError } = await supabase
    .from('user_vehicle')
    .select('id, nickname, year, make, model, trim, odometer')
    .eq('id', vehicleId)
    .eq('owner_id', user.id)
    .single()

  if (vehicleError || !vehicle) {
    throw new Error('Vehicle not found or access denied')
  }

  // Construct vehicle name and ymmt from available fields
  const vehicleName = vehicle.nickname || `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'Unknown Vehicle'
  const ymmt = `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.trim || ''}`.trim()

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
      created_at,
      mod_parts (
        quantity_used,
        part_inventory (
          id,
          name,
          vendor_name,
          cost
        )
      ),
      mod_outcome (
        id,
        outcome_type,
        notes,
        event_date
      )
    `)
    .eq('user_vehicle_id', vehicleId)
    .order('event_date', { ascending: false, nullsFirst: false })

  if (modsError) {
    console.error('Error fetching mods:', modsError)
    throw new Error('Failed to fetch mods data')
  }

  // Transform the data
  const mods: VehicleMod[] = (modsData || []).map(mod => {
    // Handle event_date - it can be null, fallback to created_at
    let eventDate: Date
    if (mod.event_date) {
      eventDate = new Date(mod.event_date)
    } else if (mod.created_at) {
      eventDate = new Date(mod.created_at)
    } else {
      // Last resort fallback
      eventDate = new Date()
    }

    // Transform parts - mod_parts is an array, each with quantity_used and part_inventory (which is an object, not array)
    const parts: ModPart[] = (mod.mod_parts || [])
      .filter((mp: any) => mp.part_inventory) // Filter out any mod_parts with missing part_inventory
      .map((mp: any) => {
        const part = mp.part_inventory
        return {
          id: part.id || '',
          name: part.name || 'Unknown Part',
          vendor: part.vendor_name || undefined,
          cost: part.cost ? Number(part.cost) : undefined,
          quantity: mp.quantity_used || 1
        }
      })

    // Transform outcome - mod_outcome is an array but should only have one item due to UNIQUE constraint
    let outcome: ModOutcome | undefined
    if (mod.mod_outcome && mod.mod_outcome.length > 0) {
      const outcomeData = mod.mod_outcome[0]
      if (outcomeData) {
        // Convert outcome_type enum to boolean (assuming 'success' means true, anything else means false)
        // Since we don't know the exact enum values, we'll check if it contains 'success' or similar
        const outcomeType = String(outcomeData.outcome_type || '').toLowerCase()
        const success = outcomeType.includes('success') || outcomeType === 'successful'
        
        outcome = {
          id: outcomeData.id,
          success,
          notes: outcomeData.notes || undefined,
          event_date: new Date(outcomeData.event_date)
        }
      }
    }

    return {
      id: mod.id,
      title: mod.title,
      description: mod.description || undefined,
      status: mod.status,
      cost: mod.cost ? Number(mod.cost) : undefined,
      odometer: mod.odometer || undefined,
      event_date: eventDate,
      parts,
      outcome
    }
  })

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
      name: vehicleName,
      ymmt: ymmt,
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

