'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { FuelLogSchema, FuelLogInputs } from './schema'
import { recalculateMpg, updateVehicleAvgMpg } from './lib/fuel-calculations-server'

//
// ACTION: The "Two-Write" (Log Fuel + Update Vehicle Odometer)
//
export async function logFuel(data: FuelLogInputs) {
  try {
    // 0. Basic input validation
    if (!data || typeof data !== 'object') {
      return { error: 'Invalid input data' }
    }

    // 1. Validate data first (before any async operations)
    let validatedData
    try {
      validatedData = FuelLogSchema.parse(data)
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return {
          error: 'Validation failed.',
          details: validationError.issues.map(err => ({
            message: err.message,
            path: err.path.map(String),
          })),
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
      .select('id, odometer')
      .eq('id', validatedData.user_vehicle_id)
      .eq('owner_id', user.id)
      .single()

    if (vehicleError || !vehicle) {
      return { error: 'Vehicle not found or access denied' }
    }

    // --- 1. GET DATA FOR CALCULATIONS ---
    // Get the *previous* fuel log to calculate trip_miles and mpg
    const { data: lastLog } = await supabase
      .from('fuel_log')
      .select('odometer')
      .eq('user_vehicle_id', validatedData.user_vehicle_id)
      .lt('odometer', validatedData.odometer) // Find the log immediately BEFORE this mileage
      .order('odometer', { ascending: false })
      .limit(1)
      .single()

    // --- 2. CALCULATE NEW FIELDS ---
    const total_cost = validatedData.gallons * validatedData.price_per_gallon
    let trip_miles = validatedData.trip_miles ?? null

    // If trip_miles not provided, calculate it from previous log
    if (!trip_miles && lastLog && validatedData.odometer > lastLog.odometer) {
      trip_miles = validatedData.odometer - lastLog.odometer
    }

    // Calculate MPG using trip_miles divided by gallons for each new row
    let mpg = null
    if (trip_miles != null && trip_miles > 0 && validatedData.gallons > 0) {
      mpg = trip_miles / validatedData.gallons
    }

    // --- 3. WRITE 1: Create the new `fuel_log` entry ---
    const { data: logEntry, error: logError } = await supabase
      .from('fuel_log')
      .insert({
        user_id: user.id,
        user_vehicle_id: validatedData.user_vehicle_id,
        event_date: validatedData.event_date,
        odometer: validatedData.odometer,
        gallons: validatedData.gallons,
        price_per_gallon: validatedData.price_per_gallon,
        total_cost: total_cost,
        trip_miles: trip_miles,
        mpg: mpg,
        octane: validatedData.octane ?? null,
      })
      .select('id')
      .single()

    if (logError) {
      console.error('Error logging fuel:', logError)
      return { error: 'Failed to create fuel log entry.' }
    }

    if (!logEntry || !logEntry.id) {
      console.error('No log entry returned after insert')
      return { error: 'Failed to create fuel log entry: No entry returned' }
    }

    // --- 4. WRITE 2: Update the vehicle's main odometer ---
    // Only update if the new reading is higher than the current one
    const currentOdometer = vehicle.odometer || 0
    if (validatedData.odometer > currentOdometer) {
      const { error: vehicleUpdateError } = await supabase
        .from('user_vehicle')
        .update({ odometer: validatedData.odometer })
        .eq('id', validatedData.user_vehicle_id)
        .eq('owner_id', user.id) // RLS check

      if (vehicleUpdateError) {
        console.error('Error updating vehicle odometer:', vehicleUpdateError)
        // Soft fail, the log was still created.
      }
    }

    // --- 5. RECALCULATION & CLEANUP ---
    // Instead of manual calculation inline, we strictly use the robust helper
    // to ensure consistency regardless of insertion order.

    // Recalculate THIS log's MPG
    await recalculateMpg(supabase, logEntry.id)

    // Recalculate the NEXT log's MPG (if any)
    const { data: nextLog } = await supabase
      .from('fuel_log')
      .select('id')
      .eq('user_vehicle_id', validatedData.user_vehicle_id)
      .gt('odometer', validatedData.odometer)
      .order('odometer', { ascending: true })
      .limit(1)
      .single()

    if (nextLog) {
      await recalculateMpg(supabase, nextLog.id)
    }

    // Update vehicle Average MPG
    await updateVehicleAvgMpg(supabase, validatedData.user_vehicle_id, user.id)

    // --- 6. Revalidate paths and return success ---
    try {
      revalidatePath(`/vehicle/${validatedData.user_vehicle_id}/service`)
      revalidatePath(`/vehicle/${validatedData.user_vehicle_id}/fuel`)
      revalidatePath(`/vehicle/${validatedData.user_vehicle_id}/shop-log`)
    } catch (revalidateError) {
      console.error('Error revalidating path:', revalidateError)
      // Don't fail the whole request if revalidation fails
    }

    return { success: true, logId: logEntry.id }
  } catch (e) {
    if (e instanceof z.ZodError) {
      console.error('Zod validation error:', e.issues)
      return {
        error: 'Validation failed.',
        details: e.issues.map(err => ({
          message: err.message,
          path: err.path.map(String),
        })),
      }
    }
    console.error('Unhandled error in logFuel:', e)
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.'
    return { error: errorMessage }
  }
}


