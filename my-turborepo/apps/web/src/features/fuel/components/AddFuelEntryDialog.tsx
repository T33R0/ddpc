'use client'

import React, { useState } from 'react'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'

interface AddFuelEntryDialogProps {
  vehicleId: string
}

export function AddFuelEntryDialog({ vehicleId }: AddFuelEntryDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleAddEntry = () => {
    // Placeholder for future fuel entry functionality
    alert('Fuel entry functionality will be implemented in a future update. This will allow you to log fuel purchases, track MPG, and monitor fuel costs over time.')

    // For now, just close the dialog
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Fuel Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Add Fuel Entry</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Coming Soon</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              The fuel entry feature is under development. Soon you'll be able to log fuel purchases,
              track your MPG, and get detailed insights into your fuel efficiency.
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">Planned Features:</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Log fuel purchases with gallons and cost</li>
              <li>• Automatic MPG calculations</li>
              <li>• Fuel cost tracking and analysis</li>
              <li>• Integration with odometer readings</li>
              <li>• Fuel efficiency trends and insights</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddEntry}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Notify Me When Ready
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
