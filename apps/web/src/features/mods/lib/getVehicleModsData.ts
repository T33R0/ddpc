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
  status: 'planned' | 'ordered' | 'installed' | 'tuned' | 'archived'
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
  // Note: mods table uses 'notes' (not 'title'/'description') and 'mod_item_id' (FK to mod_items)
  const { data: modsData, error: modsError } = await supabase
    .from('mods')
    .select(`
      id,
      notes,
      mod_item_id,
      status,
      cost,
      odometer,
      event_date,
      created_at,
      mod_item:mod_items (
        id,
        name,
        description
      ),
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
    interface ModPartJoin {
      quantity_used: number;
      part_inventory: {
        id: string;
        name: string;
        vendor_name?: string;
        cost?: number;
      } | null;
    }

    const parts: ModPart[] = ((mod.mod_parts as unknown) as ModPartJoin[])
      .filter((mp: ModPartJoin): mp is ModPartJoin => {
        const p = mp as ModPartJoin;
        return !!p.part_inventory;
      })
      .map((mp: ModPartJoin) => {
        const part = mp.part_inventory!;
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

    // Extract title and description from notes field or mod_item
    // If mod_item exists, use its name as title, otherwise parse notes
    let title: string
    let description: string | undefined
    
    // Handle mod_item - Supabase returns it as an object (single join result)
    const modItem = mod.mod_item as unknown as { id: string; name: string; description?: string } | null | undefined
    
    if (modItem && typeof modItem === 'object' && 'name' in modItem && modItem.name) {
      // Use mod_item name as title
      title = modItem.name
      description = mod.notes || modItem.description || undefined
    } else if (mod.notes) {
      // Parse notes - first line is title, rest is description
      const notesLines = mod.notes.split('\n\n')
      title = notesLines[0] || 'Modification'
      description = notesLines.slice(1).join('\n\n') || undefined
    } else {
      title = 'Modification'
      description = undefined
    }

    return {
      id: mod.id,
      title,
      description,
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

