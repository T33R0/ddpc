'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { updateServiceInterval } from '@/lib/supabase/maintenance'
import { validateAndRecordOdometerReading } from '@/lib/odometer-service'
import { ServiceLogSchema, ServiceLogInputs } from './schema'

//
// ACTION 1: The "Two-Write" (Guided)
// This logs the service *and* updates the plan.
//
export async function logPlannedService(data: ServiceLogInputs) {
  try {
    // 0. Basic input validation
    if (!data || typeof data !== 'object') {
      return { error: 'Invalid input data' }
    }
    
    // 1. Validate data first (before any async operations)
    let validatedData
    try {
      validatedData = ServiceLogSchema.parse(data)
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return { 
          error: 'Validation failed.', 
          details: validationError.errors.map(err => ({
            message: err.message,
            path: err.path.map(String)
          }))
        }
      }
      throw validationError
    }
    
    const supabase = await createClient()

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
    const odometerValue: number | null = validatedData.odometer ?? null
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
      return { error: `Failed to create log entry: ${logError.message || 'Unknown error'}` }
    }

    if (!logEntry || !logEntry.id) {
      console.error('No log entry returned after insert')
      return { error: 'Failed to create log entry: No entry returned' }
    }

    // --- WRITE 2: Update the `service_intervals` plan item ---
    if (validatedData.plan_item_id) {
      try {
        // Use the existing updateServiceInterval function
        await updateServiceInterval(
          supabase,
          validatedData.plan_item_id,
          validatedData.user_vehicle_id,
          odometerValue,
          validatedData.event_date
        )
      } catch (updateError) {
        console.error('Error updating service interval:', updateError)
        // This is a soft failure - the log entry was already created
        // We don't want to fail the whole request if the update fails
      }
    }

    // --- 3. Revalidate path and return success ---
    try {
      revalidatePath(`/vehicle/${validatedData.user_vehicle_id}/service`)
    } catch (revalidateError) {
      console.error('Error revalidating path:', revalidateError)
      // Don't fail the whole request if revalidation fails
    }
    
    return { success: true, logId: logEntry.id }
  } catch (e) {
    if (e instanceof z.ZodError) {
      // Handle validation errors
      console.error('Zod validation error:', e.errors)
      return { 
        error: 'Validation failed.', 
        details: e.errors.map(err => ({
          message: err.message,
          path: err.path.map(String) // Convert to string array for serialization
        }))
      }
    }
    // Handle all other errors
    console.error('Unhandled error in logPlannedService:', e)
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.'
    return { error: errorMessage }
  }
}

//
// ACTION 2: The "Free-Text" (Simple)
// This just creates a log entry. Used by the "+ Add Service" button.
//
export async function logFreeTextService(data: ServiceLogInputs) {
  try {
    // 0. Basic input validation
    if (!data || typeof data !== 'object') {
      return { error: 'Invalid input data' }
    }
    
    // 1. Validate data first (before any async operations)
    let validatedData
    try {
      validatedData = ServiceLogSchema.parse(data)
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return { 
          error: 'Validation failed.', 
          details: validationError.errors.map(err => ({
            message: err.message,
            path: err.path.map(String)
          }))
        }
      }
      throw validationError
    }
    
    const supabase = await createClient()

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
    const odometerValue: number | null = validatedData.odometer ?? null
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
      return { error: `Failed to create log entry: ${logError.message || 'Unknown error'}` }
    }

    if (!logEntry || !logEntry.id) {
      console.error('No log entry returned after insert')
      return { error: 'Failed to create log entry: No entry returned' }
    }

    // --- 2. Revalidate path and return success ---
    try {
      revalidatePath(`/vehicle/${validatedData.user_vehicle_id}/service`)
    } catch (revalidateError) {
      console.error('Error revalidating path:', revalidateError)
      // Don't fail the whole request if revalidation fails
    }
    
    return { success: true, logId: logEntry.id }
  } catch (e) {
    if (e instanceof z.ZodError) {
      // Handle validation errors
      console.error('Zod validation error:', e.errors)
      return { 
        error: 'Validation failed.', 
        details: e.errors.map(err => ({
          message: err.message,
          path: err.path.map(String) // Convert to string array for serialization
        }))
      }
    }
    // Handle all other errors
    console.error('Unhandled error in logFreeTextService:', e)
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.'
    return { error: errorMessage }
  }
}
