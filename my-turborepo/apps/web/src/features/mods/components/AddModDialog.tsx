'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Textarea } from '@repo/ui/textarea'
import { Plus, Wrench } from 'lucide-react'

interface AddModDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AddModDialog({ isOpen, onClose, onSuccess }: AddModDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const params = useParams()
  const vehicleId = params.id as string

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      vehicleId,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      status: formData.get('status') as string,
      cost: formData.get('cost') as string,
      odometer: formData.get('odometer') as string,
      event_date: formData.get('event_date') as string,
    }

    try {
      const response = await fetch('/api/garage/log-mod', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add modification')
      }

      // Success
      onClose()
      onSuccess?.()
    } catch (error) {
      console.error('Error adding modification:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Wrench className="h-5 w-5" />
            Add Modification
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Track a new modification or upgrade for your vehicle.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900/50 border border-red-500 rounded p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="title" className="text-gray-300">
              Modification Title *
            </Label>
            <Input
              name="title"
              id="title"
              placeholder="e.g., Turbo Upgrade, Exhaust System"
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              required
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-gray-300">
              Description
            </Label>
            <Textarea
              name="description"
              id="description"
              placeholder="Brief description of the modification..."
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 min-h-[60px]"
            />
          </div>

          <div>
            <Label htmlFor="status" className="text-gray-300">
              Status *
            </Label>
            <select
              name="status"
              id="status"
              className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="" className="bg-gray-800 text-gray-400">Select status</option>
              <option value="planned" className="bg-gray-800 text-white">Planned</option>
              <option value="ordered" className="bg-gray-800 text-white">Ordered</option>
              <option value="installed" className="bg-gray-800 text-white">Installed</option>
              <option value="tuned" className="bg-gray-800 text-white">Tuned</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cost" className="text-gray-300">
                Cost ($)
              </Label>
              <Input
                name="cost"
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
                name="odometer"
                id="odometer"
                type="number"
                placeholder="Current mileage"
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="event_date" className="text-gray-300">
              Date *
            </Label>
            <Input
              name="event_date"
              id="event_date"
              type="date"
              className="bg-gray-800 border-gray-600 text-white"
              required
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
                  Add Mod
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

