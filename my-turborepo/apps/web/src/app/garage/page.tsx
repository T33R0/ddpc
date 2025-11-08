import { createClient } from '@/lib/supabase/server'
import { GarageContent } from '@/features/garage/GarageContent'
import { VehicleWithOdometer } from '@repo/types'

// Server Component that fetches data
export default async function GaragePage() {
  let vehiclesWithOdometer: VehicleWithOdometer[] = []
  let preferredVehicleId: string | null = null

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
        let odometerMap = new Map<string, number>()

        if (vehicleIds.length > 0) {
          const { data: odometerLogs } = await supabase
            .from('odometer_log')
            .select('user_vehicle_id, reading_mi, recorded_at')
            .in('user_vehicle_id', vehicleIds)
            .order('recorded_at', { ascending: false })

          // Group by vehicle and take the most recent reading
          const groupedLogs = odometerLogs?.reduce((acc, log) => {
            if (!acc[log.user_vehicle_id] || acc[log.user_vehicle_id].recorded_at < log.recorded_at) {
              acc[log.user_vehicle_id] = log
            }
            return acc
          }, {} as Record<string, any>) || {}

          Object.values(groupedLogs).forEach((log: any) => {
            odometerMap.set(log.user_vehicle_id, log.reading_mi)
          })
        }

        // Transform data
        vehiclesWithOdometer = vehicles.map((v: any) => {
          const latestMileage = odometerMap.get(v.id) ?? v.odometer
          return {
            id: v.id,
            name: v.nickname || v.title || `${v.year || ''} ${v.make || ''} ${v.model || ''} ${v.trim || ''}`.trim() || 'Unnamed Vehicle',
            nickname: v.nickname,
            ymmt: `${v.year || ''} ${v.make || ''} ${v.model || ''} ${v.trim || ''}`.trim(),
            odometer: latestMileage,
            current_status: v.current_status || 'parked',
            image_url: v.photo_url,
            make: v.vehicle_data?.make,
            model: v.vehicle_data?.model,
            year: v.vehicle_data?.year,
            trim: v.vehicle_data?.trim,
          }
        })

        // Try to get preferred vehicle ID
        const { data: userProfile } = await supabase
          .from('user_profile')
          .select('preferred_vehicle_id')
          .eq('user_id', user.id)
          .single()

        preferredVehicleId = userProfile?.preferred_vehicle_id || null
      }
    }
  } catch (error) {
    // If server-side data fetching fails, we'll render with empty data
    // The client component will handle auth redirects if needed
    console.error('Server-side data fetching failed:', error)
  }

  // Always render the client component with whatever data we have
  return <GarageContent initialVehicles={vehiclesWithOdometer} preferredVehicleId={preferredVehicleId} />
}
