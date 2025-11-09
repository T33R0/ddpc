import React from 'react'
import { notFound } from 'next/navigation'
import { getVehicleServiceData } from '@/features/service/lib/getVehicleServiceData'
import { VehicleServicePageClient } from './VehicleServicePageClient'

export const revalidate = 0; // Ensure data is always fresh

interface VehicleServicePageProps {
  params: Promise<{ id: string }>
}

export default async function VehicleServicePage({ params }: VehicleServicePageProps) {
  const { id: vehicleId } = await params

  if (!vehicleId) {
    notFound()
  }

  const serviceData = await getVehicleServiceData(vehicleId)

  return <VehicleServicePageClient serviceData={serviceData} />
}
