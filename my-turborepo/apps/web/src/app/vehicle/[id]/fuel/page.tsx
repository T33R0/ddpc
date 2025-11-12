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

  return (
    <section className="relative py-12 bg-black min-h-screen">
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
