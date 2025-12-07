'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@repo/ui/modal'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Textarea } from '@repo/ui/textarea'
import { Plus, Wrench } from 'lucide-react'

interface AddModDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  vehicleId?: string
}

export function AddModDialog({ isOpen, onClose, onSuccess, vehicleId: propVehicleId }: AddModDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const params = useParams()
  const vehicleId = propVehicleId || (params.id as string)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    // Combine title and description into notes field (mods table uses notes, not title/description)
    const notes = description ? `${title}\n\n${description}` : title
    
    const data = {
      vehicleId,
      notes,
      status: formData.get('status') as string,
      cost: formData.get('cost') as string,
      odometer: formData.get('odometer') as string,
      event_date: formData.get('event_date') as string,
    }

    try {
      const response = await fetch('/api/garage/add-mod', {
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
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent
        className="sm:max-w-md p-0"
      >
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Add Modification
          </ModalTitle>
          <ModalDescription>
            Track a new modification or upgrade for your vehicle.
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">
              Modification Title *
            </Label>
            <Input
              name="title"
              id="title"
              placeholder="e.g., Turbo Upgrade, Exhaust System"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description
            </Label>
            <Textarea
              name="description"
              id="description"
              placeholder="Brief description of the modification..."
              className="min-h-[60px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">
              Status *
            </Label>
            <select
              name="status"
              id="status"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="">Select status</option>
              <option value="planned">Planned</option>
              <option value="ordered">Ordered</option>
              <option value="installed">Installed</option>
              <option value="tuned">Tuned</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost">
                Cost ($)
              </Label>
              <Input
                name="cost"
                id="cost"
                type="number"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="odometer">
                Odometer (miles)
              </Label>
              <Input
                name="odometer"
                id="odometer"
                type="number"
                placeholder="Current mileage"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_date">
              Date *
            </Label>
            <Input
              name="event_date"
              id="event_date"
              type="date"
              required
            />
          </div>

          <ModalFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
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
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}

