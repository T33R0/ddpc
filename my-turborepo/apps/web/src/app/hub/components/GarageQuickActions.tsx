'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { Fuel, Wrench } from 'lucide-react'
import { useVehicles, Vehicle } from '../../../lib/hooks/useVehicles'
import { SelectVehicleDialog } from './SelectVehicleDialog'
import { AddFuelDialog } from '@/features/fuel/components'
import { AddServiceDialog } from '@/features/service/components/AddServiceDialog'

export function GarageQuickActions() {
  const router = useRouter()
  const { data, isLoading } = useVehicles()
  const vehicles = data?.vehicles || []

  const [isSelectVehicleOpen, setIsSelectVehicleOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<'fuel' | 'service' | null>(null)

  const [isFuelLogOpen, setIsFuelLogOpen] = useState(false)
  const [isServiceLogOpen, setIsServiceLogOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)

  const handleActionClick = (action: 'fuel' | 'service') => {
    if (isLoading) return

    if (vehicles.length === 0) {
      // If no vehicles, maybe redirect to garage to add one?
      if (confirm('No vehicles found. Would you like to go to your Garage to add one?')) {
        router.push('/garage')
      }
      return
    }

    if (vehicles.length === 1) {
      // Auto-select the only vehicle
      const vehicle = vehicles[0]
      if (vehicle) {
        setSelectedVehicle(vehicle)
        if (action === 'fuel') setIsFuelLogOpen(true)
        if (action === 'service') setIsServiceLogOpen(true)
      }
    } else {
      // Multiple vehicles, open selection dialog
      setSelectedAction(action)
      setIsSelectVehicleOpen(true)
    }
  }

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    if (selectedAction === 'fuel') setIsFuelLogOpen(true)
    if (selectedAction === 'service') setIsServiceLogOpen(true)
    setSelectedAction(null)
  }

  // Wrap in a div that stops propagation to prevent bubbling to the parent Card's onClick
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div className="flex gap-2 mt-4 z-20 relative">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 bg-background/80 backdrop-blur-sm hover:bg-background/90 text-xs sm:text-sm h-9"
          onClick={() => handleActionClick('fuel')}
        >
          <Fuel className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          Log Fuel
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 bg-background/80 backdrop-blur-sm hover:bg-background/90 text-xs sm:text-sm h-9"
          onClick={() => handleActionClick('service')}
        >
          <Wrench className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          Log Service
        </Button>
      </div>

      <SelectVehicleDialog
        isOpen={isSelectVehicleOpen}
        onClose={() => setIsSelectVehicleOpen(false)}
        vehicles={vehicles}
        onSelect={handleVehicleSelect}
        actionLabel={selectedAction === 'fuel' ? 'log fuel' : 'log service'}
      />

      {selectedVehicle && (
        <>
          <AddFuelDialog
            isOpen={isFuelLogOpen}
            onClose={() => setIsFuelLogOpen(false)}
            vehicleId={selectedVehicle.id}
            currentOdometer={selectedVehicle.odometer}
          />

          <AddServiceDialog
            isOpen={isServiceLogOpen}
            onClose={() => setIsServiceLogOpen(false)}
            vehicleId={selectedVehicle.id}
          />
        </>
      )}
    </div>
  )
}
