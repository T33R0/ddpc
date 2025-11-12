'use client'
// Fuel Page Client Component - Main client component for fuel tracking page
// This file must be committed to git for the build to succeed

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { Fuel } from 'lucide-react'
import { AddFuelDialog } from './components/AddFuelDialog'
import { FuelHistoryChart } from './components/FuelHistoryChart'
import { MpgHealthDial } from './components/MpgHealthDial'
import { FuelLogEntries } from './components/FuelLogEntries'
import { VehicleFuelData } from './lib/getVehicleFuelData'

interface FuelPageClientProps {
  fuelData: VehicleFuelData
}

export function FuelPageClient({ fuelData }: FuelPageClientProps) {
  const router = useRouter()
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false)

  return (
    <>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white">Vehicle Fuel</h1>
          <p className="text-lg text-gray-400 mt-2">Fuel economy and consumption tracking</p>
        </div>
        <Button
          onClick={() => setIsFuelModalOpen(true)}
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          <Fuel className="mr-2 h-4 w-4" /> Log Fuel
        </Button>
      </div>

      {/* Chart and Dial Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <FuelHistoryChart
          fuelEntries={fuelData.fuelEntries}
          factoryMpg={fuelData.vehicle.factoryMpg}
        />
        <MpgHealthDial
          averageMpg={fuelData.stats.averageMpg}
          factoryMpg={fuelData.vehicle.factoryMpg}
        />
      </div>

      {/* Fuel Log Entries */}
      <FuelLogEntries fuelEntries={fuelData.fuelEntries} />

      <AddFuelDialog
        isOpen={isFuelModalOpen}
        onClose={() => {
          setIsFuelModalOpen(false)
          router.refresh()
        }}
        vehicleId={fuelData.vehicle.id}
        currentOdometer={fuelData.vehicle.odometer ?? null}
      />
    </>
  )
}

