'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export type AddVehicleState = {
    success?: boolean
    vehicleId?: string
    error?: string
}

export async function addVehicleToGarage(
    vehicleDataId: string,
    vin?: string
): Promise<AddVehicleState> {
    const schema = z.string().min(1)
    const parse = schema.safeParse(vehicleDataId)

    if (!parse.success) {
        console.error('[addVehicleToGarage] Invalid vehicleDataId:', parse.error)
        return { error: 'Invalid Vehicle ID' }
    }

    console.log(`[addVehicleToGarage] Starting for vehicleDataId: ${vehicleDataId}, VIN: ${vin || 'none'}`)
    const supabase = await createClient()

    try {
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            console.error('[addVehicleToGarage] Auth error:', authError)
            return { error: 'Unauthorized' }
        }
        console.log(`[addVehicleToGarage] User authenticated: ${user.id}`)

        // --- 1. Fetch Stock Data ---
        console.log('[addVehicleToGarage] Fetching stock data...')
        const { data: stockData, error: stockError } = await supabase
            .from('vehicle_data')
            .select('*')
            .eq('id', vehicleDataId)
            .single()

        if (stockError || !stockData) {
            console.error('[addVehicleToGarage] Stock data error:', stockError)
            return { error: 'Failed to find stock vehicle data' }
        }
        console.log('[addVehicleToGarage] Stock data found')

        // Also fetch the primary image for the vehicle
        const { data: primaryImage } = await supabase
            .from('vehicle_primary_image')
            .select('url')
            .eq('vehicle_id', vehicleDataId)
            .single()

        // --- 2. Create the User's Vehicle ---
        console.log('[addVehicleToGarage] Creating user vehicle...')
        const { data: newVehicle, error: createVehicleError } = await supabase
            .from('user_vehicle')
            .insert({
                owner_id: user.id,
                stock_data_id: vehicleDataId,
                vin: vin || null, // Use the provided VIN
                year: stockData.year ? parseInt(stockData.year) : null,
                make: stockData.make,
                model: stockData.model,
                trim: stockData.trim,
                nickname: stockData.trim,
                photo_url: primaryImage?.url || null,
                title: stockData.trim_description || stockData.trim,
                spec_snapshot: stockData, // Copy the entire stock data object
                horsepower_hp: stockData.horsepower_hp ? parseInt(stockData.horsepower_hp) : null,
                torque_ft_lbs: stockData.torque_ft_lbs ? parseInt(stockData.torque_ft_lbs) : null,
                engine_size_l: stockData.engine_size_l ? parseFloat(stockData.engine_size_l) : null,
                cylinders: stockData.cylinders,
                fuel_type: stockData.fuel_type,
                drive_type: stockData.drive_type,
                transmission: stockData.transmission,
                length_in: stockData.length_in ? parseFloat(stockData.length_in) : null,
                width_in: stockData.width_in ? parseFloat(stockData.width_in) : null,
                height_in: stockData.height_in ? parseFloat(stockData.height_in) : null,
                body_type: stockData.body_type,
                colors_exterior: stockData.colors_exterior,
                epa_combined_mpg: stockData.epa_combined_mpg ? parseFloat(stockData.epa_combined_mpg) : null,
            })
            .select('id, owner_id, stock_data_id') // Get the new vehicle's ID
            .single()

        if (createVehicleError || !newVehicle) {
            console.error('[addVehicleToGarage] Create vehicle error:', createVehicleError)
            return { error: `Failed to add vehicle to garage: ${createVehicleError?.message || 'Unknown error'} (Code: ${createVehicleError?.code})` }
        }
        console.log(`[addVehicleToGarage] Vehicle created: ${newVehicle.id}`)

        //
        // --- 3. (SSI LOGIC) Seeding Pipeline ---
        //
        try {
            console.log('[addVehicleToGarage] Starting SSI seeding...')
            // 3.1. Find all master schedule items for this vehicle type
            const { data: masterSchedule, error: scheduleError } = await supabase
                .from('master_service_schedule')
                .select('*')
                .eq('vehicle_data_id', newVehicle.stock_data_id)

            if (scheduleError) {
                throw scheduleError // Caught by the try/catch
            }

            if (masterSchedule && masterSchedule.length > 0) {
                console.log(`[addVehicleToGarage] Found ${masterSchedule.length} schedule items to seed`)
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
                console.log('[addVehicleToGarage] SSI seeding complete')
            } else {
                console.log('[addVehicleToGarage] No schedule items found to seed')
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

        revalidatePath('/garage')
        console.log('[addVehicleToGarage] Success')
        return { success: true, vehicleId: newVehicle.id }
    } catch (error) {
        console.error('[addVehicleToGarage] Unexpected error adding vehicle:', error)
        return { error: 'An unexpected error occurred' }
    }
}

export type OnboardingData = {
    vehicleId: string
    acquisitionDate: string // ISO date string
    acquisitionType: string
    acquisitionCost?: number
    ownershipEndDate?: string // ISO date string
    status?: string
}

export async function completeOnboarding(data: OnboardingData) {
    const schema = z.object({
        vehicleId: z.string().uuid(),
        acquisitionDate: z.string().min(1),
        acquisitionType: z.string().min(1),
        acquisitionCost: z.number().nonnegative().optional(),
        ownershipEndDate: z.string().optional(),
        status: z.enum(['active', 'inactive', 'archived']).optional()
    })

    const parse = schema.safeParse(data)
    if (!parse.success) {
        console.error('Validation error in completeOnboarding:', parse.error)
        return { error: 'Invalid input data' }
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return { error: 'Unauthorized' }
    }

    const updates: any = {
        is_onboarding_completed: true,
        acquisition_date: data.acquisitionDate,
        acquisition_type: data.acquisitionType,
        acquisition_cost: data.acquisitionCost,
    }

    if (data.ownershipEndDate) {
        updates.ownership_end_date = data.ownershipEndDate
    }

    if (data.status) {
        updates.current_status = data.status
    }

    const { error } = await supabase
        .from('user_vehicle')
        .update(updates)
        .eq('id', data.vehicleId)
        .eq('owner_id', user.id)

    if (error) {
        console.error('Error completing onboarding:', error)
        return { error: error.message }
    }

    revalidatePath(`/vehicle/${data.vehicleId}`)
    return { success: true }
}
