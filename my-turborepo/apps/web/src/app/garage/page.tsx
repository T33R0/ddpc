import { createClient } from '@/lib/supabase/server'
import { GarageContent } from '@/features/garage/GarageContent'
import { VehicleWithOdometer } from '@repo/types'

// Server Component that fetches data
export default async function GaragePage() {
  let vehiclesWithOdometer: VehicleWithOdometer[] = []

  try {
    const supabase = await createClient()

    // Try to get user, but don't fail if we can't
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Fetch vehicles with RLS policies protecting access
      const { data: vehicles, error: vehicleError } = await supabase
        .from('user_vehicle')
        .select(`
          *,
          vehicle_data ( make, model, year, trim, body_type, fuel_type, drive_type )
        `)
        .eq('owner_id', user.id)

      if (!vehicleError && vehicles) {
        // Fetch latest odometer readings
        const vehicleIds = vehicles.map((v) => v.id)
        const odometerMap = new Map<string, number>()

        if (vehicleIds.length > 0) {
          const { data: odometerLogs } = await supabase
            .from('odometer_log')
            .select('user_vehicle_id, reading_mi, recorded_at')
            .in('user_vehicle_id', vehicleIds)
            .order('recorded_at', { ascending: false })

          // Group by vehicle and take the most recent reading
          type OdometerLog = { user_vehicle_id: string; reading_mi: number; recorded_at: string }
          const groupedLogs = odometerLogs?.reduce((acc, log) => {
            const existingLog = acc[log.user_vehicle_id]
            if (!existingLog || existingLog.recorded_at < log.recorded_at) {
              acc[log.user_vehicle_id] = log
            }
            return acc
          }, {} as Record<string, OdometerLog>) || {}

          Object.values(groupedLogs).forEach((log) => {
            odometerMap.set(log.user_vehicle_id, log.reading_mi)
          })
        }

        // Transform data
        vehiclesWithOdometer = vehicles.map((v) => {
          const latestMileage = odometerMap.get(v.id) ?? v.odometer
          return {
            id: v.id,
            name: v.nickname || v.title || `${v.year || ''} ${v.make || ''} ${v.model || ''} ${v.trim || ''}`.trim() || 'Unnamed Vehicle',
            nickname: v.nickname,
            ymmt: `${v.year || ''} ${v.make || ''} ${v.model || ''} ${v.trim || ''}`.trim(),
            odometer: latestMileage,
            current_status: v.current_status || 'parked',
            image_url: v.vehicle_image || v.photo_url, // Prioritize vehicle_image over photo_url
            vehicle_image: v.vehicle_image, // Include vehicle_image field
            make: v.vehicle_data?.make,
            model: v.vehicle_data?.model,
            year: v.vehicle_data?.year,
            trim: v.vehicle_data?.trim,
          }
        })
      }
    }
  } catch (error) {
    // If server-side data fetching fails, we'll render with empty data
    // The client component will handle auth redirects if needed
    console.error('Server-side data fetching failed:', error)
  }

  // Always render the client component with whatever data we have
  return <GarageContent initialVehicles={vehiclesWithOdometer} />
}
