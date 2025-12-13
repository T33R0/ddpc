'use client'

import React from 'react'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from '@repo/ui/modal'
import { Button } from '@repo/ui/button'
import { Vehicle } from '../../../lib/hooks/useVehicles'
import { Car } from 'lucide-react'

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
      <ModalContent className="sm:max-w-md">
        <ModalHeader>
          <ModalTitle>Select Vehicle</ModalTitle>
          <ModalDescription>
            Choose a vehicle to {actionLabel}.
          </ModalDescription>
        </ModalHeader>

        <div className="grid gap-4 py-4">
          {vehicles.length === 0 ? (
            <div className="text-center text-muted-foreground p-4">
              No vehicles found.
            </div>
          ) : (
            vehicles.map((vehicle) => (
              <Button
                key={vehicle.id}
                variant="outline"
                className="h-auto p-4 flex items-center justify-start gap-4 hover:bg-accent hover:text-accent-foreground transition-all"
                onClick={() => handleSelect(vehicle)}
              >
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Car size={20} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-base">{vehicle.name}</span>
                  <span className="text-xs text-muted-foreground">{vehicle.ymmt}</span>
                </div>
              </Button>
            ))
          )}
        </div>
      </ModalContent>
    </Modal>
  )
}
