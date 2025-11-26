'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'



export type AddVehicleState = {
    success?: boolean
    vehicleId?: string
    error?: string
}

export async function addVehicleToGarage(
    vehicleDataId: string
): Promise<AddVehicleState> {
    const supabase = await createClient()

    try {
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return { error: 'Unauthorized' }
        }

        // --- 1. Fetch Stock Data ---
        const { data: stockData, error: stockError } = await supabase
            .from('vehicle_data')
            .select('*')
            .eq('id', vehicleDataId)
            .single()

        if (stockError || !stockData) {
            console.error('Stock data error:', stockError)
            return { error: 'Failed to find stock vehicle data' }
        }

        // Also fetch the primary image for the vehicle
        const { data: primaryImage } = await supabase
            .from('vehicle_primary_image')
            .select('url')
            .eq('vehicle_id', vehicleDataId)
            .single()

        // --- 2. Create the User's Vehicle ---
        const { data: newVehicle, error: createVehicleError } = await supabase
            .from('user_vehicle')
            .insert({
                owner_id: user.id,
                stock_data_id: vehicleDataId,
                vin: null, // You'll get this later
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
            console.error('Create vehicle error:', createVehicleError)
            return { error: 'Failed to add vehicle to garage' }
        }

        //
        // --- 3. (SSI LOGIC) Seeding Pipeline ---
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

        revalidatePath('/garage')
        return { success: true, vehicleId: newVehicle.id }
    } catch (error) {
        console.error('Unexpected error adding vehicle:', error)
        return { error: 'An unexpected error occurred' }
    }
}
