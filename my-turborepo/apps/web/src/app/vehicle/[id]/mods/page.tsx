import React from 'react'
import { notFound, redirect } from 'next/navigation'
import { getVehicleModsData } from '@/features/mods/lib/getVehicleModsData'
import { VehicleModsPageClient } from './VehicleModsPageClient'
import { resolveVehicleSlug, isUUID } from '@/lib/vehicle-utils'

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
  try {
    modsData = await getVehicleModsData(vehicleId) // Use resolved UUID
  } catch (error) {
    console.error('Error fetching vehicle mods data:', error)
    // For now, show empty state if there's an error
    // TODO: Add proper error handling UI
    modsData = {
      vehicle: { id: vehicleId, name: 'Unknown Vehicle', ymmt: '', odometer: undefined },
      mods: [],
      summary: {
        totalMods: 0,
        totalCost: 0,
        inProgressCount: 0,
        completedCount: 0
      }
    }
  }

  return <VehicleModsPageClient modsData={modsData} />
}
