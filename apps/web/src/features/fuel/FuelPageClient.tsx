
'use client'
// ============================================================================
// Fuel Page Client Component - Main client component for fuel tracking page
// File: my-turborepo/apps/web/src/features/fuel/FuelPageClient.tsx
// ============================================================================


import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { Fuel, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import {
  AddFuelDialog,
  FuelHistoryChart,
  FuelLogEntries
} from './components'
import { VehicleHealthSummary } from '@/features/vehicle/components/VehicleHealthSummary'
import { NeedsAttentionModal } from '@/features/vehicle/components/NeedsAttentionModal'
import { VehicleFuelData } from './lib/getVehicleFuelData'

interface FuelPageClientProps {
  fuelData: VehicleFuelData
  vehicleSlug: string
}

export function FuelPageClient({ fuelData, vehicleSlug }: FuelPageClientProps) {
  const router = useRouter()
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false)
  const [isNeedsAttentionOpen, setIsNeedsAttentionOpen] = useState(false)

  return (
    <>
      <div className="mb-8">
        <Button
          variant="outline"
          className="mb-4 border-border text-muted-foreground hover:bg-muted hover:border-accent"
          asChild
        >
          <Link href={`/vehicle/${vehicleSlug}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vehicle
          </Link>
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Vehicle Fuel</h1>
            <p className="text-lg text-muted-foreground mt-2">Fuel economy and consumption tracking</p>
          </div>
          <Button
            onClick={() => setIsFuelModalOpen(true)}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            <Fuel className="mr-2 h-4 w-4" /> Log Fuel
          </Button>
        </div>
      </div>

      {/* Chart and Dial Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <FuelHistoryChart
          fuelEntries={fuelData.fuelEntries}
          factoryMpg={fuelData.vehicle.factoryMpg}
        />
        <VehicleHealthSummary
          averageMpg={fuelData.stats.averageMpg}
          factoryMpg={fuelData.vehicle.factoryMpg}
          inventoryStats={fuelData.inventoryStats}
          recordCount={fuelData.recordCount}
          onNeedsAttentionClick={() => setIsNeedsAttentionOpen(true)}
          vehicleId={fuelData.vehicle.id}
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

      <NeedsAttentionModal
          isOpen={isNeedsAttentionOpen}
          onClose={() => setIsNeedsAttentionOpen(false)}
          parts={fuelData.inventoryStats?.partsNeedingAttentionList || []}
          vehicleId={fuelData.vehicle.id}
      />
    </>
  )
}

