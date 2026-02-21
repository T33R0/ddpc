import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GarageContent } from '@/features/garage/GarageContent'
import { VehicleWithOdometer } from '@repo/types'

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Server Component that fetches data
export default async function GaragePage() {
  let vehiclesWithOdometer: VehicleWithOdometer[] = []
  let user = null
  let needsOnboarding = false

  try {
    const supabase = await createClient()

    // Try to get user, but don't fail if we can't
    const userResponse = await supabase.auth.getUser()
    user = userResponse.data.user

    if (user) {
      // Check if user needs onboarding
      const { data: profile } = await supabase
        .from('user_profile')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .maybeSingle()

      if (profile && profile.onboarding_completed === false) {
        needsOnboarding = true
      }

      if (!needsOnboarding) {
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
              odometer: v.odometer,
              avg_mpg: v.avg_mpg,
              record_count: totalRecords,
              current_status: v.current_status || 'inactive',
              image_url: v.vehicle_image || v.photo_url,
              vehicle_image: v.vehicle_image,
              make: v.vehicle_data?.make,
              model: v.vehicle_data?.model,
              year: v.vehicle_data?.year,
              trim: v.vehicle_data?.trim,
            }
          })
        }
      }
    }
  } catch (error) {
    // If server-side data fetching fails, we'll render with empty data
    // The client component will handle auth redirects if needed
    console.error('Server-side data fetching failed:', error)
  }

  // Redirect OUTSIDE try/catch — Next.js redirect() throws a special error
  // that must not be caught
  if (needsOnboarding) {
    redirect('/onboarding')
  }

  // Always render the client component with whatever data we have
  return <GarageContent initialVehicles={vehiclesWithOdometer} user={user} />
}
