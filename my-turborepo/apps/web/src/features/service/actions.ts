'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { updateServiceInterval } from '@/lib/supabase/maintenance'
import { validateAndRecordOdometerReading } from '@/lib/odometer-service'

// Zod schema for the form
export const ServiceLogSchema = z.object({
  user_vehicle_id: z.string().uuid(),
  description: z.string().min(3, 'Description is required.'),
  service_provider: z.string().optional(),
  cost: z.coerce.number().min(0).optional(),
  odometer: z.coerce.number().min(0).optional(),
  event_date: z.string().date('Invalid date format.'),
  notes: z.string().optional(),
  // This is the key. It's the ID of the `service_intervals` item.
  plan_item_id: z.string().uuid().optional(),
})

export type ServiceLogInputs = z.infer<typeof ServiceLogSchema>

//
// ACTION 1: The "Two-Write" (Guided)
// This logs the service *and* updates the plan.
//
export async function logPlannedService(data: ServiceLogInputs) {
  const supabase = await createClient()

  // 1. Validate data
  const validatedData = ServiceLogSchema.parse(data)

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Verify user owns this vehicle
  const { data: vehicle, error: vehicleError } = await supabase
    .from('user_vehicle')
    .select('id')
    .eq('id', validatedData.user_vehicle_id)
    .eq('owner_id', user.id)
    .single()

  if (vehicleError || !vehicle) {
    return { error: 'Vehicle not found or access denied' }
  }

  // Validate and record odometer reading if provided
  let odometerValue: number | null = validatedData.odometer ?? null
  if (odometerValue !== null) {
    const odometerValidation = await validateAndRecordOdometerReading(
      supabase,
      validatedData.user_vehicle_id,
      odometerValue,
      validatedData.event_date
    )

    if (!odometerValidation.success) {
      return { 
        error: odometerValidation.error || 'Failed to validate odometer reading',
        code: odometerValidation.code
      }
    }
  }

  // --- WRITE 1: Create the history item in `maintenance_log` ---
  const { data: logEntry, error: logError } = await supabase
    .from('maintenance_log')
    .insert({
      user_vehicle_id: validatedData.user_vehicle_id,
      description: validatedData.description,
      service_provider: validatedData.service_provider || null,
      cost: validatedData.cost || null,
      odometer: odometerValue,
      event_date: validatedData.event_date,
      notes: validatedData.notes || null,
      // We can even link it to the plan item for traceability
      service_interval_id: validatedData.plan_item_id || null,
    })
    .select('id')
    .single()

  if (logError) {
    console.error('Error logging service:', logError)
    return { error: 'Failed to create log entry.' }
  }

  // --- WRITE 2: Update the `service_intervals` plan item ---
  if (validatedData.plan_item_id) {
    // Use the existing updateServiceInterval function
    await updateServiceInterval(
      supabase,
      validatedData.plan_item_id,
      validatedData.user_vehicle_id,
      odometerValue,
      validatedData.event_date
    )
  }

  // --- 3. Revalidate path and return success ---
  revalidatePath(`/vehicle/${validatedData.user_vehicle_id}/service`)
  return { success: true, logId: logEntry.id }
}

//
// ACTION 2: The "Free-Text" (Simple)
// This just creates a log entry. Used by the "+ Add Service" button.
//
export async function logFreeTextService(data: ServiceLogInputs) {
  const supabase = await createClient()

  // 1. Validate data
  const validatedData = ServiceLogSchema.parse(data)

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Verify user owns this vehicle
  const { data: vehicle, error: vehicleError } = await supabase
    .from('user_vehicle')
    .select('id')
    .eq('id', validatedData.user_vehicle_id)
    .eq('owner_id', user.id)
    .single()

  if (vehicleError || !vehicle) {
    return { error: 'Vehicle not found or access denied' }
  }

  // Validate and record odometer reading if provided
  let odometerValue: number | null = validatedData.odometer ?? null
  if (odometerValue !== null) {
    const odometerValidation = await validateAndRecordOdometerReading(
      supabase,
      validatedData.user_vehicle_id,
      odometerValue,
      validatedData.event_date
    )

    if (!odometerValidation.success) {
      return { 
        error: odometerValidation.error || 'Failed to validate odometer reading',
        code: odometerValidation.code
      }
    }
  }

  // --- WRITE 1: Create the history item in `maintenance_log` ---
  const { data: logEntry, error: logError } = await supabase
    .from('maintenance_log')
    .insert({
      user_vehicle_id: validatedData.user_vehicle_id,
      description: validatedData.description,
      service_provider: validatedData.service_provider || null,
      cost: validatedData.cost || null,
      odometer: odometerValue,
      event_date: validatedData.event_date,
      notes: validatedData.notes || null,
    })
    .select('id')
    .single()

  if (logError) {
    console.error('Error logging service:', logError)
    return { error: 'Failed to create log entry.' }
  }

  // --- 2. Revalidate path and return success ---
  revalidatePath(`/vehicle/${validatedData.user_vehicle_id}/service`)
  return { success: true, logId: logEntry.id }
}

