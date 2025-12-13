'use client'

import React from 'react'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from '@repo/ui/modal'
import { Vehicle } from '../../../lib/hooks/useVehicles'
import { ImageWithTimeoutFallback } from '@/components/image-with-timeout-fallback'
import { cn } from '@repo/ui/lib/utils'

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
                  className={cn(
                    "group relative flex flex-col border rounded-xl overflow-hidden cursor-pointer transition-all duration-200",
                    "hover:border-primary hover:shadow-md active:scale-[0.98]",
                    "bg-card text-card-foreground"
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelect(vehicle)
                  }}
                >
                  <div className="aspect-video w-full relative bg-muted">
                    <ImageWithTimeoutFallback
                      src={vehicle.image_url || "/branding/fallback-logo.png"}
                      fallbackSrc="/branding/fallback-logo.png"
                      alt={vehicle.name}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white font-medium px-3 py-1 bg-black/60 rounded-full text-sm backdrop-blur-sm">
                        Select
                      </span>
                    </div>
                  </div>

                  <div className="p-3">
                    <h3 className="font-semibold text-sm truncate">{vehicle.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{vehicle.ymmt}</p>

                    <div className="mt-2 flex items-center gap-2">
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        vehicle.current_status === 'daily_driver' ? "bg-green-500" :
                        vehicle.current_status === 'parked' ? "bg-yellow-500" : "bg-gray-500"
                      )} />
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                        {vehicle.current_status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ModalContent>
    </Modal>
  )
}
