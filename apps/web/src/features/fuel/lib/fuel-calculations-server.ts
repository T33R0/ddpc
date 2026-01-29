import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Recalculates MPG for a specific fuel log entry based on the previous entry.
 * Updates the 'trip_miles' and 'mpg' fields of the log.
 */
export async function recalculateMpg(supabase: SupabaseClient, logId: string) {
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
        if (trip_miles > 0 && currentLog.gallons > 0) {
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

/**
 * Recalculates the average MPG for a vehicle based on all valid fuel logs
 * and updates the 'avg_mpg' field in the 'user_vehicle' table.
 */
export async function updateVehicleAvgMpg(supabase: SupabaseClient, vehicleId: string, userId: string) {
    const { data: allFuelLogs } = await supabase
        .from('fuel_log')
        .select('mpg')
        .eq('user_vehicle_id', vehicleId)
        .not('mpg', 'is', null)

    let averageMpg: number | null = null

    if (allFuelLogs && allFuelLogs.length > 0) {
        const validMpgEntries = allFuelLogs
            .map(log => log.mpg)
            .filter((mpg): mpg is number => mpg != null && mpg > 0)

        if (validMpgEntries.length > 0) {
            averageMpg = validMpgEntries.reduce((sum, mpg) => sum + mpg, 0) / validMpgEntries.length
        }
    }

    // Update vehicle Average MPG
    // If no valid entries, we might want to set it to null or leave it?
    // Generally if we have logs but no valid MPG (e.g. only 1 log), avg_mpg should technically be null.
    // The original code only updated if validMpgEntries.length > 0.
    // I will preserve that behavior to avoid wiping data unnecessarily, but strictly speaking it should be synced.
    // If validMpgEntries is empty, averageMpg remains null.

    if (averageMpg !== null) {
        await supabase
            .from('user_vehicle')
            .update({ avg_mpg: averageMpg })
            .eq('id', vehicleId)
            .eq('owner_id', userId) // RLS check
    }
}
