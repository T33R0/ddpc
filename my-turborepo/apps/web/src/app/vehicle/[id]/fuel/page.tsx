// ============================================================================
// Vehicle Fuel Page - Server component for fuel tracking
// CRITICAL: Ensure FuelPageClient.tsx and all component files are committed
// File: my-turborepo/apps/web/src/app/vehicle/[id]/fuel/page.tsx
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { FuelPageClient } from '@/features/fuel/FuelPageClient'
import { getVehicleFuelData } from '@/features/fuel/lib/getVehicleFuelData'

export const revalidate = 0 // Ensure data is always fresh

type VehicleFuelPageProps = {
  params: Promise<{ id: string }> // This can be nickname or UUID
}

export default async function VehicleFuelPage({ params }: VehicleFuelPageProps) {
  const resolvedParams = await params
  const vehicleSlug = decodeURIComponent(resolvedParams.id)
  const supabase = await createClient()

  if (!vehicleSlug) {
    notFound()
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect(
      '/auth/signin?message=You must be logged in to view a vehicle fuel page.'
    )
  }

  let fuelData
  try {
    fuelData = await getVehicleFuelData(vehicleSlug)
  } catch (error) {
    console.error('Error fetching fuel data:', error)
    notFound() // Trigger 404 if vehicle not found
  }

  // Redirect to nickname URL if accessed via UUID and vehicle has nickname
  const isLikelyUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vehicleSlug)
  const vehicleNickname = fuelData.vehicle.nickname // Actual nickname from database
  if (vehicleNickname && isLikelyUUID) {
    redirect(`/vehicle/${encodeURIComponent(vehicleNickname)}/fuel`)
  }

  return (
    <section className="relative py-12 bg-background min-h-screen">
      <div
        aria-hidden="true"
        className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20"
      >
        <div className="blur-[106px] h-56 bg-gradient-to-br from-red-500 to-purple-400" />
        <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300" />
      </div>

      <div className="relative container px-4 md:px-6 pt-24">
        <FuelPageClient fuelData={fuelData} />
      </div>
    </section>
  )
}
