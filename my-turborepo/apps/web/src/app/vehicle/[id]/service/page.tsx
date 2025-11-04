import React from 'react'
import { notFound } from 'next/navigation'
import { getVehicleServiceData } from '@/features/service/lib/getVehicleServiceData'
import { VehicleServicePageClient } from './VehicleServicePageClient'

interface VehicleServicePageProps {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ refresh?: string }>
}

export default async function VehicleServicePage({ params, searchParams }: VehicleServicePageProps) {
  const { id: vehicleId } = await params
  const search = await searchParams

  if (!vehicleId) {
    notFound()
  }

  let serviceData
  try {
    serviceData = await getVehicleServiceData(vehicleId)
  } catch (error) {
    console.error('Error fetching vehicle service data:', error)
    // For now, show empty state if there's an error
    // TODO: Add proper error handling UI
    serviceData = {
      vehicle: { id: vehicleId, name: 'Unknown Vehicle', ymmt: '', odometer: undefined },
      serviceHistory: [],
      upcomingServices: [],
    }
  }

  return <VehicleServicePageClient serviceData={serviceData} refreshParam={search?.refresh} />
}
