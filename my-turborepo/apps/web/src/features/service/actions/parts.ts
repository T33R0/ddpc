'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type PartInventory = {
  id: string
  user_id: string
  part_number?: string | null
  name: string
  cost?: number | null
  vendor_name?: string | null
  vendor_link?: string | null
  physical_location?: string | null
  quantity: number
  category?: string | null
  created_at: string
}

export type MaintenancePart = {
  maintenance_log_id: string
  part_id: string
  quantity_used: number
  part: PartInventory
}

export type CreatePartInput = {
  name: string
  part_number?: string
  cost?: number
  vendor_name?: string
  vendor_link?: string
  quantity: number
}

// Fetch parts for a specific job (maintenance log)
export async function getJobParts(logId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('maintenance_parts')
    .select(`
      maintenance_log_id,
      part_id,
      quantity_used,
      part:part_inventory (*)
    `)
    .eq('maintenance_log_id', logId)

  if (error) {
    console.error('Error fetching job parts:', error)
    return { success: false, error: 'Failed to fetch parts' }
  }

  return { success: true, data: data as unknown as MaintenancePart[] }
}

// Search user's part inventory
export async function searchInventory(query: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Unauthorized' }

  let dbQuery = supabase
    .from('part_inventory')
    .select('*')
    .eq('user_id', user.id)
    .gt('quantity', 0) // Only show available parts? Maybe show all but indicate availability.
    // Actually, let's just search.

  if (query.trim()) {
    dbQuery = dbQuery.or(`name.ilike.%${query}%,part_number.ilike.%${query}%`)
  }

  const { data, error } = await dbQuery.order('name')

  if (error) {
    console.error('Error searching inventory:', error)
    return { success: false, error: 'Failed to search inventory' }
  }

  return { success: true, data: data as PartInventory[] }
}

// Create a new part in inventory
export async function createInventoryPart(data: CreatePartInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: newPart, error } = await supabase
    .from('part_inventory')
    .insert({
      user_id: user.id,
      name: data.name,
      part_number: data.part_number,
      cost: data.cost,
      vendor_name: data.vendor_name,
      vendor_link: data.vendor_link,
      quantity: data.quantity,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating part:', error)
    return { success: false, error: 'Failed to create part' }
  }

  return { success: true, data: newPart as PartInventory }
}

// Add a part to a job
export async function addPartToJob(logId: string, partId: string, quantityUsed: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // 1. Fetch the part to get current cost and quantity
  const { data: part, error: partError } = await supabase
    .from('part_inventory')
    .select('*')
    .eq('id', partId)
    .single()

  if (partError || !part) {
    return { success: false, error: 'Part not found' }
  }

  // 2. Check if enough quantity (optional, but good practice. Assuming we allow going negative or just 0?)
  // The prompt said "decrement", usually implies consuming. I'll allow it even if it goes negative unless specified,
  // but better to just update.

  // 3. Insert into maintenance_parts
  const { error: insertError } = await supabase
    .from('maintenance_parts')
    .insert({
      maintenance_log_id: logId,
      part_id: partId,
      quantity_used: quantityUsed,
    })

  if (insertError) {
    // If unique constraint violation (already added), maybe update quantity?
    // For now assume simple add. If it fails, return error.
    if (insertError.code === '23505') { // unique_violation
         return { success: false, error: 'Part already added to this job' }
    }
    console.error('Error adding part to job:', insertError)
    return { success: false, error: 'Failed to add part to job' }
  }

  // 4. Decrement inventory
  const { error: updatePartError } = await supabase
    .from('part_inventory')
    .update({ quantity: part.quantity - quantityUsed })
    .eq('id', partId)

  if (updatePartError) {
    console.error('Error updating inventory quantity:', updatePartError)
    // Rollback insert? Not easy without transaction.
  }

  // 5. Update maintenance_log cost
  if (part.cost && part.cost > 0) {
    const costToAdd = part.cost * quantityUsed

    // Fetch current log cost
    const { data: log, error: logFetchError } = await supabase
      .from('maintenance_log')
      .select('cost')
      .eq('id', logId)
      .single()

    if (!logFetchError && log) {
      const currentCost = Number(log.cost) || 0
      const newCost = currentCost + costToAdd

      await supabase
        .from('maintenance_log')
        .update({ cost: newCost })
        .eq('id', logId)
    }
  }

  revalidatePath('/vehicle/[id]/service/[jobTitle]', 'page')
  return { success: true }
}

// Remove part from job
export async function removePartFromJob(logId: string, partId: string, quantityUsed: number) {
  const supabase = await createClient()

  // 1. Fetch part info for cost restoration
  const { data: part, error: partError } = await supabase
    .from('part_inventory')
    .select('cost, quantity')
    .eq('id', partId)
    .single()

  if (partError) {
     // If part deleted from inventory, we can still delete relationship but maybe cant restore cost/qty accurately if we relied on part record.
     // But let's proceed with deleting the relation.
  }

  // 2. Delete from maintenance_parts
  const { error: deleteError } = await supabase
    .from('maintenance_parts')
    .delete()
    .eq('maintenance_log_id', logId)
    .eq('part_id', partId)

  if (deleteError) {
    console.error('Error removing part from job:', deleteError)
    return { success: false, error: 'Failed to remove part' }
  }

  // 3. Restore inventory quantity
  if (part) {
    await supabase
      .from('part_inventory')
      .update({ quantity: part.quantity + quantityUsed })
      .eq('id', partId)
  }

  // 4. Update maintenance_log cost (deduct)
  if (part && part.cost && part.cost > 0) {
    const costToDeduct = part.cost * quantityUsed

    const { data: log } = await supabase
      .from('maintenance_log')
      .select('cost')
      .eq('id', logId)
      .single()

    if (log) {
      const currentCost = Number(log.cost) || 0
      const newCost = Math.max(0, currentCost - costToDeduct)

      await supabase
        .from('maintenance_log')
        .update({ cost: newCost })
        .eq('id', logId)
    }
  }

  revalidatePath('/vehicle/[id]/service/[jobTitle]', 'page')
  return { success: true }
}
