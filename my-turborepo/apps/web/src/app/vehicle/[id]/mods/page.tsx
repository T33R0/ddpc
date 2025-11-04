import React from 'react'
import { notFound } from 'next/navigation'
import { getVehicleModsData } from '@/features/mods/lib/getVehicleModsData'
import { VehicleModsPageClient } from './VehicleModsPageClient'

interface VehicleModsPageProps {
  params: Promise<{ id: string }>
}

export default async function VehicleModsPage({ params }: VehicleModsPageProps) {
  const { id: vehicleId } = await params

  if (!vehicleId) {
    notFound()
  }

  let modsData
  try {
    modsData = await getVehicleModsData(vehicleId)
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
