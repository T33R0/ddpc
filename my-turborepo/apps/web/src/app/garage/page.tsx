import { createClient } from '@/lib/supabase/server'
import { GarageContent } from '@/features/garage/GarageContent'
import { VehicleWithOdometer } from '@repo/types'

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Server Component that fetches data
export default async function GaragePage() {
  let vehiclesWithOdometer: VehicleWithOdometer[] = [] // Using existing type but enriching data structure effectively
  let user = null

  try {
    const supabase = await createClient()

    // Try to get user, but don't fail if we can't
    const userResponse = await supabase.auth.getUser()
    user = userResponse.data.user

    if (user) {
      // Fetch vehicles with stats
      const { data: vehicles, error: vehicleError } = await supabase
        .from('user_vehicle')
        .select(`
          *,
          vehicle_data ( make, model, year, trim, body_type, fuel_type, drive_type ),
          maintenance_log (count),
          fuel_log (count),
          mods (count)
        `)
        .eq('owner_id', user.id)

      if (!vehicleError && vehicles) {
        // Transform data
        vehiclesWithOdometer = vehicles.map((v) => {
          // Calculate record counts
          const maintenanceCount = v.maintenance_log?.[0]?.count || 0
          const fuelCount = v.fuel_log?.[0]?.count || 0
          const modsCount = v.mods?.[0]?.count || 0
          const totalRecords = maintenanceCount + fuelCount + modsCount

          return {
            id: v.id,
            name: v.nickname || v.title || `${v.year || ''} ${v.make || ''} ${v.model || ''} ${v.trim || ''}`.trim() || 'Unnamed Vehicle',
            nickname: v.nickname,
            ymmt: `${v.year || ''} ${v.make || ''} ${v.model || ''} ${v.trim || ''}`.trim(),
            odometer: v.odometer, // Using direct user_vehicle odometer as requested
            avg_mpg: v.avg_mpg,
            record_count: totalRecords,
            current_status: v.current_status || 'inactive',
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
  return <GarageContent initialVehicles={vehiclesWithOdometer} user={user} />
}
