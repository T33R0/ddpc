import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GarageClientPage } from '@/features/garage/GarageClientPage'
import { VehicleWithOdometer } from '@repo/types'
import { AuthProvider } from '@repo/ui/auth-context'
import { supabase } from '@/lib/supabase'

//
// This is now an async Server Component
//
export default async function GaragePage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/signin?message=You must be logged in to view your garage.')
  }

  // --- 1. Fetch Vehicles (Logic from old API route) ---
  const { data: vehicles, error: vehicleError } = await supabase
    .from('user_vehicle')
    .select(`
      *,
      vehicle_data ( make, model, year, trim, body_type, fuel_type, drive_type )
    `)
    .eq('owner_id', user.id)

  if (vehicleError) {
    console.error('Error fetching vehicles:', vehicleError)
    // Handle error UI - for now, return empty array
  }

  // --- 2. Fetch Latest Odometer Readings (Logic from old API route) ---
  const vehicleIds = vehicles?.map((v) => v.id) || []
  let odometerMap = new Map<string, number>()

  if (vehicleIds.length > 0) {
    const { data: odometerLogs, error: odometerError } = await supabase
      .from('odometer_log')
      .select('user_vehicle_id, reading_mi, recorded_at')
      .in('user_vehicle_id', vehicleIds)
      .order('recorded_at', { ascending: false })

    if (odometerError) {
      console.error('Error fetching odometer logs:', odometerError)
    }

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

  // --- 3. Fetch User's Preferred Vehicle ID ---
  let preferredVehicleId = null
  try {
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profile')
      .select('preferred_vehicle_id')
      .eq('user_id', user.id)
      .single()

    if (!profileError) {
      preferredVehicleId = userProfile?.preferred_vehicle_id || null
    } else if (profileError.message.includes('column') && profileError.message.includes('does not exist')) {
      console.warn('preferred_vehicle_id column does not exist yet')
      preferredVehicleId = null
    } else {
      console.error('Error fetching user profile:', profileError)
    }
  } catch (profileError) {
    console.error('Exception fetching user profile:', profileError)
  }

  // --- 4. Transform Data (Logic from old API route) ---
  const vehiclesWithOdometer: VehicleWithOdometer[] =
    vehicles?.map((v: any) => {
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
    }) || []

  // --- 5. Pass Data to Client Component ---
  return (
    <AuthProvider supabase={supabase}>
      <GarageClientPage
        initialVehicles={vehiclesWithOdometer}
        preferredVehicleId={preferredVehicleId}
      />
    </AuthProvider>
  )
}
