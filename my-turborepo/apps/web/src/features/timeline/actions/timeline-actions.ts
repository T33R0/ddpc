'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

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
  const uuid = logId.replace('maintenance-', '')
  const idSchema = z.string().uuid()

  if (!idSchema.safeParse(uuid).success) {
    return { success: false, error: 'Invalid Log ID' }
  }

  const dataSchema = z.object({
    event_date: z.date(),
    odometer: z.number().nonnegative().optional(),
    cost: z.number().nonnegative().optional(),
    service_provider: z.string().optional(),
    notes: z.string().optional(),
    title: z.string().min(1).optional(),
    is_edited: z.boolean().optional()
  })

  if (!dataSchema.safeParse(data).success) {
    return { success: false, error: 'Invalid input data' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

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
  const uuid = modId.replace('mod-', '')
  const idSchema = z.string().uuid()

  if (!idSchema.safeParse(uuid).success) {
    return { success: false, error: 'Invalid Mod ID' }
  }

  const dataSchema = z.object({
    event_date: z.date(),
    odometer: z.number().nonnegative().optional(),
    cost: z.number().nonnegative().optional(),
    status: z.string().optional(), // Status for mods is likely a string/enum but keeping it generic to avoid breaking if unknown
    notes: z.string().optional(),
    title: z.string().min(1).optional()
  })

  if (!dataSchema.safeParse(data).success) {
    return { success: false, error: 'Invalid input data' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

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
  const uuid = logId.replace('mileage-', '')
  const idSchema = z.string().uuid()

  if (!idSchema.safeParse(uuid).success) {
    return { success: false, error: 'Invalid Log ID' }
  }

  const dataSchema = z.object({
    date: z.date(),
    odometer: z.number().nonnegative()
  })

  if (!dataSchema.safeParse(data).success) {
    return { success: false, error: 'Invalid input data' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

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

export async function updateFuelLog(
  logId: string,
  data: {
    event_date: Date
    odometer: number
    cost: number
    notes?: string
    // TODO: support gallons, price_per_gallon, octane if we add them to the simple edit form
  }
): Promise<UpdateResult> {
  const uuid = logId.replace('fuel-', '')
  const idSchema = z.string().uuid()

  if (!idSchema.safeParse(uuid).success) {
    return { success: false, error: 'Invalid Log ID' }
  }

  const dataSchema = z.object({
    event_date: z.date(),
    odometer: z.number().nonnegative(),
    cost: z.number().nonnegative(),
    notes: z.string().optional()
  })

  if (!dataSchema.safeParse(data).success) {
    return { success: false, error: 'Invalid input data' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Verify ownership and get current values (to recalculate derived fields if needed)
  const { data: log, error: fetchError } = await supabase
    .from('fuel_log')
    .select('user_vehicle_id, gallons, odometer, user_vehicle:user_vehicle_id(owner_id)')
    .eq('id', uuid)
    .single()

  if (fetchError || !log) {
    return { success: false, error: 'Record not found' }
  }

  // @ts-expect-error user_vehicle relation type inference
  if (log.user_vehicle.owner_id !== user.id) {
    return { success: false, error: 'Unauthorized' }
  }

  // We are currently ONLY editing date, odometer, cost, notes via the simple form.
  // Gallons is NOT being edited.
  // We MUST update price_per_gallon if cost changes, or keep it consistent.
  // If we only update cost, and gallons is fixed, price_per_gallon = cost / gallons.

  let price_per_gallon: number = 0;
  if (log.gallons > 0 && data.cost > 0) {
    price_per_gallon = data.cost / log.gallons;
  }

  // 1. Get Old Values (to find the "Old Next" if we move it)
  const oldOdometer = log.odometer

  // 2. Perform Update
  const { error } = await supabase
    .from('fuel_log')
    .update({
      event_date: data.event_date.toISOString(),
      odometer: data.odometer,
      total_cost: data.cost,
      price_per_gallon: price_per_gallon,
    })
    .eq('id', uuid)

  if (error) {
    console.error('Error updating fuel log:', error)
    return { success: false, error: 'Failed to update fuel log' }
  }

  // 3. Robust MPG Recalculation Chain
  // A. Recalculate SELF (This Log)
  await recalculateMpg(supabase, uuid)

  // B. Recalculate NEW NEXT (The log immediately following the new odometer)
  const { data: newNextLog } = await supabase
    .from('fuel_log')
    .select('id')
    .eq('user_vehicle_id', log.user_vehicle_id)
    .gt('odometer', data.odometer) // > New Odometer
    .order('odometer', { ascending: true })
    .limit(1)
    .single()

  if (newNextLog) {
    await recalculateMpg(supabase, newNextLog.id)
  }

  // C. Recalculate OLD NEXT (The log that *used* to follow this one, if we moved it)
  // Only necessary if odometer changed significantly enough to potentially jump another log,
  // or simply if odometer changed at all, the "gap" needs closing.
  if (oldOdometer !== data.odometer) {
    const { data: oldNextLog } = await supabase
      .from('fuel_log')
      .select('id')
      .eq('user_vehicle_id', log.user_vehicle_id)
      .gt('odometer', oldOdometer) // > Old Odometer
      .neq('id', uuid) // Don't pick self if self moved slightly but check logic handles this
      .order('odometer', { ascending: true })
      .limit(1)
      .single()

    if (oldNextLog) {
      // If we moved "down", newNext might be same as oldNext, but `recalculateMpg` is cheap enough just to run.
      // Uniqueness check: if oldNextLog.id === newNextLog.id, we already did it.
      if (!newNextLog || newNextLog.id !== oldNextLog.id) {
        await recalculateMpg(supabase, oldNextLog.id)
      }
    }
  }

  revalidatePath('/vehicle/[id]/history', 'page')
  revalidatePath('/vehicle/[id]/fuel', 'page')
  return { success: true }
}

// Helper for Robust MPG Calculation (Duplicated from fuel/actions.ts or should be shared lib)
// For now duplicating to keep actions self-contained as requested.
async function recalculateMpg(supabase: any, logId: string) {
  // 1. Get current log details
  const { data: currentLog } = await supabase
    .from('fuel_log')
    .select('id, user_vehicle_id, odometer, gallons')
    .eq('id', logId)
    .single()

  if (!currentLog) return

  // 2. Find immediate predecessor
  const { data: prevLog } = await supabase
    .from('fuel_log')
    .select('odometer')
    .eq('user_vehicle_id', currentLog.user_vehicle_id)
    .lt('odometer', currentLog.odometer)
    .order('odometer', { ascending: false })
    .limit(1)
    .single()

  let mpg = null
  let trip_miles = null

  if (prevLog) {
    trip_miles = currentLog.odometer - prevLog.odometer
    if (trip_miles > 0 && currentLog.gallons > 0 && currentLog.gallons !== null) {
      mpg = trip_miles / currentLog.gallons
    }
  }

  // 3. Update the log
  await supabase
    .from('fuel_log')
    .update({
      trip_miles: trip_miles,
      mpg: mpg
    })
    .eq('id', logId)
}
