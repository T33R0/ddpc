'use client'

import React, { useState } from 'react'
import { Button } from '@repo/ui/button'
import { Fuel } from 'lucide-react'
import { AddFuelDialog } from './AddFuelDialog'

interface AddFuelEntryDialogProps {
  vehicleId: string
  currentOdometer: number | null
}

export function AddFuelEntryDialog({ vehicleId, currentOdometer }: AddFuelEntryDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="border-gray-600 text-gray-300 hover:bg-gray-800"
      >
        <Fuel className="mr-2 h-4 w-4" /> Log Fuel
      </Button>
      <AddFuelDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        vehicleId={vehicleId}
        currentOdometer={currentOdometer}
      />
    </>
  )
}
