'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Textarea } from '@repo/ui/textarea'
import { Plus, Wrench } from 'lucide-react'

interface AddServiceDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function AddServiceDialog({ isOpen, onClose }: AddServiceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // TODO: Implement service logging logic
    // This is a placeholder that will be implemented later

    setTimeout(() => {
      setIsSubmitting(false)
      onClose()
      // TODO: Refresh the service data after successful submission
    }, 1000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Wrench className="h-5 w-5" />
            Add Service Record
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description" className="text-gray-300">
              Service Description *
            </Label>
            <Input
              id="description"
              placeholder="e.g., Oil change, brake pads replacement"
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              required
            />
          </div>

          <div>
            <Label htmlFor="service_provider" className="text-gray-300">
              Service Provider
            </Label>
            <Input
              id="service_provider"
              placeholder="e.g., Dealership, Local Shop"
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cost" className="text-gray-300">
                Cost ($)
              </Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            <div>
              <Label htmlFor="odometer" className="text-gray-300">
                Odometer (miles)
              </Label>
              <Input
                id="odometer"
                type="number"
                placeholder="Current mileage"
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="event_date" className="text-gray-300">
              Service Date *
            </Label>
            <Input
              id="event_date"
              type="date"
              className="bg-gray-800 border-gray-600 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="notes" className="text-gray-300">
              Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Additional details about the service..."
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 min-h-[80px]"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                'Adding...'
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
