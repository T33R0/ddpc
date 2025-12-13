'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type UpdateResult = {
  success: boolean
  error?: string
}

export async function updateMaintenanceLog(
  logId: string,
  data: {
    event_date: Date
    odometer?: number
    cost?: number
    service_provider?: string
    notes?: string
    title?: string // Service Item Name
    is_edited?: boolean
  }
): Promise<UpdateResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Parse the ID to get the UUID (assuming format "maintenance-{uuid}")
  const uuid = logId.replace('maintenance-', '')

  // Verify ownership and fetch items
  const { data: log, error: fetchError } = await supabase
    .from('maintenance_log')
    .select('user_vehicle_id, service_items(id), user_vehicle:user_vehicle_id(owner_id)')
    .eq('id', uuid)
    .single()

  if (fetchError || !log) {
    return { success: false, error: 'Record not found' }
  }

  // @ts-expect-error user_vehicle relation type inference
  if (log.user_vehicle.owner_id !== user.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('maintenance_log')
    .update({
      event_date: data.event_date.toISOString(),
      odometer: data.odometer,
      cost: data.cost,
      service_provider: data.service_provider,
      notes: data.notes,
    })
    .eq('id', uuid)

  if (error) {
    console.error('Error updating maintenance log:', error)
    return { success: false, error: 'Failed to update record' }
  }

  // Update Service Item Name if provided
  if (data.title && log.service_items) {
    const serviceItemId = Array.isArray(log.service_items) ? log.service_items[0]?.id : (log.service_items as any).id

    if (serviceItemId) {
      const { error: itemError } = await supabase
        .from('service_items')
        .update({ name: data.title })
        .eq('id', serviceItemId)

      if (itemError) {
        console.error('Error updating service item name:', itemError)
        // We don't fail the whole request
      }
    }
  }

  revalidatePath('/vehicle/[id]/history', 'page')
  return { success: true }
}

export async function updateMod(
  modId: string,
  data: {
    event_date: Date
    odometer?: number
    cost?: number
    status?: string
    notes?: string
    title?: string // Mod Item Name
  }
): Promise<UpdateResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const uuid = modId.replace('mod-', '')

  // Verify ownership and get mod_item_id
  const { data: mod, error: fetchError } = await supabase
    .from('mods')
    .select('user_vehicle_id, mod_items(id), user_vehicle:user_vehicle_id(owner_id)')
    .eq('id', uuid)
    .single()

  if (fetchError || !mod) {
    return { success: false, error: 'Record not found' }
  }

  // @ts-expect-error user_vehicle relation type inference
  if (mod.user_vehicle.owner_id !== user.id) {
    return { success: false, error: 'Unauthorized' }
  }

  // Update Mod Record
  const { error: updateError } = await supabase
    .from('mods')
    .update({
      event_date: data.event_date.toISOString(),
      odometer: data.odometer,
      cost: data.cost,
      status: data.status,
      notes: data.notes,
    })
    .eq('id', uuid)

  if (updateError) {
    return { success: false, error: 'Failed to update mod record' }
  }

  // Update Mod Item Name if provided
  if (data.title && mod.mod_items) {
    const modItemId = Array.isArray(mod.mod_items) ? mod.mod_items[0]?.id : (mod.mod_items as any).id

    if (modItemId) {
      const { error: itemError } = await supabase
        .from('mod_items')
        .update({ name: data.title })
        .eq('id', modItemId)

      if (itemError) {
        console.error('Error updating mod item name:', itemError)
      }
    }
  }

  revalidatePath('/vehicle/[id]/history', 'page')
  return { success: true }
}

export async function updateMileage(
  logId: string,
  data: {
    date: Date // This date object might contain time, but we should be careful if user wants to preserve original time
    odometer: number
  }
): Promise<UpdateResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const uuid = logId.replace('mileage-', '')

  // Verify ownership
  const { data: log, error: fetchError } = await supabase
    .from('odometer_log')
    .select('user_vehicle_id, user_vehicle:user_vehicle_id(owner_id)')
    .eq('id', uuid)
    .single()

  if (fetchError || !log) {
    return { success: false, error: 'Record not found' }
  }

  // @ts-expect-error user_vehicle relation type inference
  if (log.user_vehicle.owner_id !== user.id) {
    return { success: false, error: 'Unauthorized' }
  }

  // If the user request was "everything... editable except recorded time", they might mean the TIMESTAMP.
  // Assuming the frontend sends the same time or we should ignore the time part of the update if possible.
  // However, `recorded_at` is a timestamptz. If we update it, we update the time.
  // I will assume the frontend is handling the "read-only" aspect by not sending a changed date/time,
  // OR the user meant "Date is editable, Time is not".
  // Given I will make the Date field Read-Only in frontend for Mileage, I will still allow updating if sent,
  // but frontend won't send changes.

  const { error } = await supabase
    .from('odometer_log')
    .update({
      recorded_at: data.date.toISOString(), // This will update to whatever date/time is passed
      reading_mi: data.odometer,
    })
    .eq('id', uuid)

  if (error) {
    console.error('Error updating mileage:', error)
    return { success: false, error: 'Failed to update mileage' }
  }

  revalidatePath('/vehicle/[id]/history', 'page')
  return { success: true }
}
