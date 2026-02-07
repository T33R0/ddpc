'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { decodeVin } from '@/lib/nhtsa'

export type AddVehicleState = {
    success?: boolean
    vehicleId?: string
    error?: string
}

// Define a simpler version of the TrimVariant for the server action to avoid strict dependency coupling if desired,
// or just use 'any' if the structure is variable. For now 'any' allows flexibility with the data passed from the client.
export async function addVehicleToGarage(
    vehicleDataId: string,
    vin?: string,
    manualData?: any
): Promise<AddVehicleState> {
    // schema validation for vehicleDataId relaxed to allow "vin-" prefix which might fail UUID check if z.string().uuid() was used
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

        // --- 0. VIN Parsing (Override Source) ---
        // If we have a valid VIN, we want to respect its specs above all else.
        // Even if manualData was passed from the client, the authoritative source is the fresh VIN decode.
        let vinOverrides: any = null;
        if (vin) {
            console.log('[addVehicleToGarage] Decoding VIN for authoritative overrides...');
            const vinResult = await decodeVin(vin);
            if (vinResult) {
                console.log('[addVehicleToGarage] VIN decoded successfully.');
                vinOverrides = vinResult.specs;
            } else {
                console.warn('[addVehicleToGarage] VIN decoding failed or returned null.');
            }
        }

        // --- 1. Fetch Stock Data ---
        let stockData: any = null;
        let primaryImage = null;
        let stockDataIdToUse: string | null = vehicleDataId;

        // Check if this is a placeholder ID from VIN decoding (starts with "vin-")
        const isPlaceholderId = vehicleDataId.startsWith('vin-');

        if (!isPlaceholderId) {
            console.log('[addVehicleToGarage] Fetching stock data...')
            const { data, error } = await supabase
                .from('vehicle_data')
                .select('*')
                .eq('id', vehicleDataId)
                .single()

            if (error || !data) {
                console.warn('[addVehicleToGarage] Stock data lookup failed:', error)
                // If we fail to find it but have manualData or vinOverrides, we can fall back to that
                if (!manualData && !vinOverrides) {
                    return { error: 'Failed to find stock vehicle data' }
                }
                stockDataIdToUse = null; // Detach from stock data ID if invalid
            } else {
                stockData = data;
                console.log('[addVehicleToGarage] Stock data found')

                // Also fetch the primary image for the vehicle
                const { data: img } = await supabase
                    .from('vehicle_primary_image')
                    .select('url')
                    .eq('vehicle_id', vehicleDataId)
                    .single()
                primaryImage = img;
            }
        } else {
            console.log('[addVehicleToGarage] Placeholder ID detected, skipping stock lookup.');
            stockDataIdToUse = null;
        }

        // If we don't have stockData yet (placeholder or lookup failed), use manualData
        if (!stockData) {
            if (manualData) {
                console.log('[addVehicleToGarage] Using provided manual data.');
                stockData = manualData;
            } else if (vinOverrides) {
                console.log('[addVehicleToGarage] Using VIN overrides as base data.');
                stockData = vinOverrides;
                 // backfill basic info if missing
                stockData.make = stockData.make || 'Unknown'; 
                stockData.model = stockData.model || 'Unknown';
            } else {
                return { error: 'Failed to find stock vehicle data and no manual data provided.' }
            }
        }

        // PATCHING LOGIC: 
        // 1. Apply manualData (if provided)
        // 2. Apply vinOverrides (authoritative, overwrites manualData and stockData)
        
        const fieldsToPatch = [
            'engine_size_l', 'cylinders', 'horsepower_hp', 'torque_ft_lbs',
            'fuel_type', 'drive_type', 'transmission', 'body_type',
            'epa_combined_mpg', 'epa_city_highway_mpg', 'curb_weight_lbs',
            'length_in', 'width_in', 'height_in'
        ];

        // Apply manualData first
        if (manualData) {
             fieldsToPatch.forEach(field => {
                if (manualData[field] !== null && manualData[field] !== undefined && manualData[field] !== '') {
                    stockData[field] = manualData[field];
                }
            });
        }

        // Apply VIN Overrides second (Highest priority)
        if (vinOverrides) {
             fieldsToPatch.forEach(field => {
                if (vinOverrides[field] !== null && vinOverrides[field] !== undefined && vinOverrides[field] !== '') {
                     console.log(`[addVehicleToGarage] VIN Override field ${field}: Old=${stockData[field]} -> New=${vinOverrides[field]}`);
                    stockData[field] = vinOverrides[field];
                }
            });
        }
        
        // --- 2. Create the User's Vehicle ---
        console.log('[addVehicleToGarage] Creating user vehicle...')

        // Prepare insert payload
        const insertPayload: any = {
            owner_id: user.id,
            stock_data_id: stockDataIdToUse, // Can be null now
            current_status: 'active',
            vin: vin || null,
            year: stockData.year ? parseInt(stockData.year.toString()) : null,
            make: stockData.make,
            model: stockData.model,
            trim: stockData.trim,
            nickname: stockData.trim,
            photo_url: primaryImage?.url || null, // manualData/placeholder doesn't have this usually
            title: stockData.trim_description || stockData.trim,
            spec_snapshot: stockData,
            // Safe parsing for numeric fields which might be strings in manualData/NHTSA data
            horsepower_hp: stockData.horsepower_hp ? parseInt(stockData.horsepower_hp.toString()) : null,
            torque_ft_lbs: stockData.torque_ft_lbs ? parseInt(stockData.torque_ft_lbs.toString()) : null,
            engine_size_l: stockData.engine_size_l ? parseFloat(stockData.engine_size_l.toString()) : null,
            cylinders: stockData.cylinders,
            fuel_type: stockData.fuel_type,
            drive_type: stockData.drive_type,
            transmission: stockData.transmission,
            length_in: stockData.length_in ? parseFloat(stockData.length_in.toString()) : null,
            width_in: stockData.width_in ? parseFloat(stockData.width_in.toString()) : null,
            height_in: stockData.height_in ? parseFloat(stockData.height_in.toString()) : null,
            body_type: stockData.body_type,
            colors_exterior: stockData.colors_exterior,
            epa_combined_mpg: stockData.epa_combined_mpg ? parseFloat(stockData.epa_combined_mpg.toString()) : null,
        };

        const { data: newVehicle, error: createVehicleError } = await supabase
            .from('user_vehicle')
            .insert(insertPayload)
            .select('id, owner_id, stock_data_id')
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

            // Only attempt seeding if we have a valid stock_data_id
            if (newVehicle.stock_data_id) {
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
            } else {
                console.log('[addVehicleToGarage] No stock_data_id, skipping SSI seeding.')
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
