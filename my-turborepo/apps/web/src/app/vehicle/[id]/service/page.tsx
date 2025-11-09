import React from 'react'
import { notFound } from 'next/navigation'
import { getVehicleServiceData } from '@/features/service/lib/getVehicleServiceData'
import { VehicleServicePageClient } from './VehicleServicePageClient'

interface VehicleServicePageProps {
  params: { id: string }
}

export default async function VehicleServicePage({ params }: VehicleServicePageProps) {
  const vehicleId = params.id

  if (!vehicleId) {
    notFound()
  }

  const serviceData = await getVehicleServiceData(vehicleId)

  return <VehicleServicePageClient serviceData={serviceData} />
}
