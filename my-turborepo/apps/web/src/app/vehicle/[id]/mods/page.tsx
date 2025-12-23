import React from 'react'
import { notFound, redirect } from 'next/navigation'
import { getVehicleModsData } from '@/features/mods/lib/getVehicleModsData'
import { VehicleModsPageClient } from './VehicleModsPageClient'
import { resolveVehicleSlug, isUUID } from '@/lib/vehicle-utils'
import { Alert, AlertTitle, AlertDescription } from '@repo/ui/alert'
import { AlertCircle } from 'lucide-react'

interface VehicleModsPageProps {
  params: Promise<{ id: string }> // This can be nickname or UUID
}

export default async function VehicleModsPage({ params }: VehicleModsPageProps) {
  const resolvedParams = await params
  const vehicleSlug = decodeURIComponent(resolvedParams.id)

  if (!vehicleSlug) {
    notFound()
  }

  // Resolve vehicle slug to UUID
  const vehicleInfo = await resolveVehicleSlug(vehicleSlug)
  if (!vehicleInfo) {
    notFound()
  }

  const { vehicleId, nickname } = vehicleInfo

  // Redirect to nickname URL if accessed via UUID and vehicle has nickname
  const isLikelyUUID = isUUID(vehicleSlug)
  if (nickname && isLikelyUUID) {
    redirect(`/vehicle/${encodeURIComponent(nickname)}/mods`)
  }

  let modsData
  let error = null

  try {
    modsData = await getVehicleModsData(vehicleId) // Use resolved UUID
  } catch (err) {
    console.error('Error fetching vehicle mods data:', err)
    error = 'Failed to load vehicle modifications. Please try again later.'
  }

  if (error) {
    return (
      <section className="relative py-12 bg-background min-h-screen">
        <div className="relative container px-4 md:px-6 pt-24">
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </section>
    )
  }

  if (!modsData) {
    return notFound()
  }

  return <VehicleModsPageClient modsData={modsData} />
}
