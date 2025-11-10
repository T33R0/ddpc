/*
-- ----------------------------------------------------------------
-- FILE: /apps/web/src/app/api/garage/add-vehicle/route.ts
-- ----------------------------------------------------------------
-- This is your existing API route, modified to include
-- the SSI "Seeding Pipeline" logic.
*/

import { createClient } from '@/lib/supabase/server'
import { ZodError, z } from 'zod'
import { NextResponse } from 'next/server'

// Your existing Zod schema
const addVehicleSchema = z.object({
  vehicleDataId: z.string().min(1, 'Vehicle Data ID is required'),
  // ... other fields you might pass
})

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      })
    }

    const body = await request.json()
    const { vehicleDataId } = addVehicleSchema.parse(body)

    // --- 1. (EXISTING LOGIC) Fetch Stock Data ---
    // (Your existing logic to fetch from `vehicle_data` goes here)
    const { data: stockData, error: stockError } = await supabase
      .from('vehicle_data')
      .select('*')
      .eq('id', vehicleDataId)
      .single()

    if (stockError || !stockData) {
      console.error('Stock data error:', stockError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to find stock vehicle data' }),
        { status: 404 }
      )
    }

    // --- 2. (EXISTING LOGIC) Create the User's Vehicle ---
    const { data: newVehicle, error: createVehicleError } = await supabase
      .from('user_vehicle')
      .insert({
        owner_id: user.id,
        stock_data_id: vehicleDataId,
        vin: null, // You'll get this later
        year: stockData.year,
        make: stockData.make,
        model: stockData.model,
        // ... all other fields you copy from stockData
      })
      .select('id, owner_id, stock_data_id') // Get the new vehicle's ID
      .single()

    if (createVehicleError || !newVehicle) {
      console.error('Create vehicle error:', createVehicleError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to add vehicle to garage' }),
        { status: 500 }
      )
    }

    //
    // --- 3. (NEW SSI LOGIC) Seeding Pipeline ---
    //
    try {
      // 3.1. Find all master schedule items for this vehicle type
      const { data: masterSchedule, error: scheduleError } = await supabase
        .from('master_service_schedule')
        .select('*')
        .eq('vehicle_data_id', newVehicle.stock_data_id)

      if (scheduleError) {
        throw scheduleError // Caught by the try/catch
      }

      if (masterSchedule && masterSchedule.length > 0) {
        // 3.2. Map them to the user's `service_intervals` table
        const intervalsToSeed = masterSchedule.map((item) => ({
          user_id: newVehicle.owner_id,
          user_vehicle_id: newVehicle.id,
          master_service_schedule_id: item.id,
          name: item.name,
          interval_months: item.interval_months,
          interval_miles: item.interval_miles,
          // due_date and due_miles are NULL by default,
          // meaning they are "Due Now".
        }))

        // 3.3. Insert all new intervals for the user
        const { error: insertIntervalsError } = await supabase
          .from('service_intervals')
          .insert(intervalsToSeed)

        if (insertIntervalsError) {
          throw insertIntervalsError // Caught by the try/catch
        }
      }
    } catch (seedingError) {
      // CRITICAL: We do NOT fail the whole request if seeding fails.
      // The user still gets their car. We just log the error.
      console.error(
        `[Seeding Pipeline Failed] for user ${user.id} and vehicle ${newVehicle.id}:`,
        seedingError
      )
    }
    // --- END OF NEW SSI LOGIC ---
    //

    // --- 4. (EXISTING LOGIC) Return Success ---
    return new NextResponse(
      JSON.stringify({ success: true, vehicleId: newVehicle.id }),
      { status: 201 }
    )
  } catch (e) {
    if (e instanceof ZodError) {
      return new NextResponse(JSON.stringify({ error: e.errors }), {
        status: 400,
      })
    }
    console.error('Unhandled error in add-vehicle:', e)
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    })
  }
}
