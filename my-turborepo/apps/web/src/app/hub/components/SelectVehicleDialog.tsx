'use client'

import React from 'react'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from '@repo/ui/modal'
import { Vehicle } from '../../../lib/hooks/useVehicles'
import { cn } from '@repo/ui/lib/utils'
import { VehicleCard } from '@/components/vehicle-card'

interface SelectVehicleDialogProps {
  isOpen: boolean
  onClose: () => void
  vehicles: Vehicle[]
  onSelect: (vehicle: Vehicle) => void
  actionLabel: string
}

export function SelectVehicleDialog({
  isOpen,
  onClose,
  vehicles,
  onSelect,
  actionLabel
}: SelectVehicleDialogProps) {

  const handleSelect = (vehicle: Vehicle) => {
    onSelect(vehicle)
    onClose()
  }

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="sm:max-w-2xl max-h-[80vh] flex flex-col p-0 overflow-hidden">
        <ModalHeader className="px-6 py-4 border-b shrink-0">
          <ModalTitle>Select Vehicle</ModalTitle>
          <ModalDescription>
            Choose a vehicle to {actionLabel}.
          </ModalDescription>
        </ModalHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {vehicles.length === 0 ? (
            <div className="text-center text-muted-foreground p-4">
              No vehicles found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelect(vehicle)
                  }}
                >
                  <VehicleCard
                    title={vehicle.name}
                    subtitle={vehicle.ymmt}
                    status={vehicle.current_status}
                    imageUrl={vehicle.image_url}
                    onClick={() => handleSelect(vehicle)}
                    className="cursor-pointer hover:bg-transparent" // Override any specific styles if needed
                    footer={
                        <div className="flex items-center gap-2 mt-2">
                           <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                            {vehicle.current_status.replace('_', ' ')}
                           </span>
                        </div>
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </ModalContent>
    </Modal>
  )
}
