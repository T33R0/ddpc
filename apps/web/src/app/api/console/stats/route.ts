import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
    try {
        const supabase = await createClient()

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch all user vehicles
        const { data: vehicles, error: vehiclesError } = await supabase
            .from('user_vehicle')
            .select('id, odometer, fuel_type, avg_mpg, stock_data_id, current_status, vehicle_data(fuel_tank_capacity_gal)')
            .eq('owner_id', user.id)

        if (vehiclesError) {
            console.error('Error fetching vehicles:', vehiclesError)
            return NextResponse.json(
                { error: 'Failed to fetch vehicles' },
                { status: 500 }
            )
        }

        const vehicleIds = vehicles?.map(v => v.id) || []

        // Fetch latest fuel log for each vehicle
        const { data: fuelLogs, error: fuelError } = vehicleIds.length > 0 ? await supabase
            .from('fuel_log')
            .select('user_vehicle_id, gallons, event_date, odometer')
            .in('user_vehicle_id', vehicleIds)
            .order('event_date', { ascending: false }) : { data: [], error: null }

        if (fuelError) {
            console.error('Error fetching fuel logs:', fuelError)
        }

        // Fetch service intervals for all vehicles
        const { data: serviceIntervals, error: intervalsError } = vehicleIds.length > 0 ? await supabase
            .from('service_intervals')
            .select('user_vehicle_id, due_date, due_miles, name')
            .in('user_vehicle_id', vehicleIds) : { data: [], error: null }

        if (intervalsError) {
            console.error('Error fetching service intervals:', intervalsError)
        }

        // Fetch financial data
        const [maintenanceResult, modsResult, fuelCostResult] = await Promise.all([
            vehicleIds.length > 0 ? supabase
                .from('maintenance_log')
                .select('cost, event_date')
                .in('user_vehicle_id', vehicleIds) : { data: [], error: null },
            vehicleIds.length > 0 ? supabase
                .from('mods')
                .select('cost, event_date')
                .in('user_vehicle_id', vehicleIds) : { data: [], error: null },
            vehicleIds.length > 0 ? supabase
                .from('fuel_log')
                .select('total_cost, event_date')
                .in('user_vehicle_id', vehicleIds) : { data: [], error: null }
        ])

        // Calculate vehicle stats
        const vehicleStats: Record<string, { latestFuelGallons: number | null; avgMpg: number | null; fuelPercentage: number | null }> = {}

        // Group fuel logs by vehicle and get latest
        const latestFuelMap = new Map<string, { user_vehicle_id: string; gallons: number; event_date: string; odometer: number }>()
        if (fuelLogs) {
            fuelLogs.forEach(log => {
                if (!latestFuelMap.has(log.user_vehicle_id)) {
                    latestFuelMap.set(log.user_vehicle_id, log)
                }
            })
        }

        vehicles?.forEach(vehicle => {
            const latestFuel = latestFuelMap.get(vehicle.id)
            // vehicle_data is returned as an array from Supabase select, get first element
            const vehicleData = Array.isArray(vehicle.vehicle_data) ? vehicle.vehicle_data[0] : vehicle.vehicle_data
            const fuelTankCapacity = vehicleData?.fuel_tank_capacity_gal

            let fuelPercentage = null
            if (latestFuel && fuelTankCapacity) {
                // Estimate fuel percentage based on gallons added
                // This is a rough estimate - actual fuel level would need more sophisticated tracking
                fuelPercentage = Math.min(100, Math.round((latestFuel.gallons / parseFloat(fuelTankCapacity)) * 100))
            }

            vehicleStats[vehicle.id] = {
                latestFuelGallons: latestFuel?.gallons || null,
                avgMpg: vehicle.avg_mpg || null,
                fuelPercentage: fuelPercentage
            }
        })

        // Calculate service status for each vehicle
        const vehicleServiceStatus: Record<string, { needsAttention: boolean, serviceDue: boolean }> = {}
        const now = new Date()
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

        vehicles?.forEach(vehicle => {
            const vehicleIntervals = serviceIntervals?.filter(si => si.user_vehicle_id === vehicle.id) || []
            let needsAttention = false
            let serviceDue = false

            vehicleIntervals.forEach(interval => {
                // Check if overdue (needs attention)
                if (interval.due_date && new Date(interval.due_date) < now) {
                    needsAttention = true
                }
                if (interval.due_miles && vehicle.odometer && interval.due_miles < vehicle.odometer) {
                    needsAttention = true
                }

                // Check if due soon (service due)
                if (interval.due_date && new Date(interval.due_date) <= thirtyDaysFromNow && new Date(interval.due_date) >= now) {
                    serviceDue = true
                }
                if (interval.due_miles && vehicle.odometer && interval.due_miles >= vehicle.odometer && interval.due_miles <= vehicle.odometer + 500) {
                    serviceDue = true
                }
            })

            vehicleServiceStatus[vehicle.id] = { needsAttention, serviceDue }
        })

        // Calculate financials
        const maintenanceCosts = maintenanceResult.data?.map(m => parseFloat(String(m.cost || 0))) || []
        const modsCosts = modsResult.data?.map(m => parseFloat(String(m.cost || 0))) || []
        const fuelCosts = fuelCostResult.data?.map(f => parseFloat(String(f.total_cost || 0))) || []

        const totalMaintenance = maintenanceCosts.reduce((sum, cost) => sum + cost, 0)
        const totalMods = modsCosts.reduce((sum, cost) => sum + cost, 0)
        const totalFuel = fuelCosts.reduce((sum, cost) => sum + cost, 0)
        const totalSpend = totalMaintenance + totalMods + totalFuel

        // Calculate average monthly spend
        const allDates = [
            ...(maintenanceResult.data?.map(m => m.event_date) || []),
            ...(modsResult.data?.map(m => m.event_date) || []),
            ...(fuelCostResult.data?.map(f => f.event_date) || [])
        ].filter(Boolean)

        let avgMonthly = 0
        if (allDates.length > 0) {
            const sortedDates = allDates.sort()
            const firstDate = new Date(sortedDates[0])
            const monthsSinceFirst = Math.max(1, Math.floor((now.getTime() - firstDate.getTime()) / (30 * 24 * 60 * 60 * 1000)))
            avgMonthly = totalSpend / monthsSinceFirst
        }

        const totalLogs = (maintenanceResult.data?.length || 0) + (modsResult.data?.length || 0) + (fuelCostResult.data?.length || 0)

        return NextResponse.json({
            vehicleStats,
            vehicleServiceStatus,
            financials: {
                totalSpend: Math.round(totalSpend * 100) / 100,
                avgMonthly: Math.round(avgMonthly * 100) / 100,
                totalLogs,
                breakdown: {
                    maintenance: Math.round(totalMaintenance * 100) / 100,
                    mods: Math.round(totalMods * 100) / 100,
                    fuel: Math.round(totalFuel * 100) / 100
                }
            }
        })

    } catch (error) {
        console.error('Unexpected error in console stats:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
