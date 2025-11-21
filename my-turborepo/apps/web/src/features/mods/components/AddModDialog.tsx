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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="bg-background max-w-md text-foreground p-0 border border-border"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Wrench className="h-5 w-5" />
            Add Modification
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Track a new modification or upgrade for your vehicle.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title" className="text-foreground">
              Modification Title *
            </Label>
            <Input
              name="title"
              id="title"
              placeholder="e.g., Turbo Upgrade, Exhaust System"
              className="bg-input border-input text-foreground placeholder:text-muted-foreground focus:border-ring px-3 py-2"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">
              Description
            </Label>
            <Textarea
              name="description"
              id="description"
              placeholder="Brief description of the modification..."
              className="bg-input border-input text-foreground placeholder:text-muted-foreground min-h-[60px] px-3 py-2 focus:border-ring"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-foreground">
              Status *
            </Label>
            <select
              name="status"
              id="status"
              className="w-full bg-input border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              required
            >
              <option value="" className="bg-background text-muted-foreground">Select status</option>
              <option value="planned" className="bg-background text-foreground">Planned</option>
              <option value="ordered" className="bg-background text-foreground">Ordered</option>
              <option value="installed" className="bg-background text-foreground">Installed</option>
              <option value="tuned" className="bg-background text-foreground">Tuned</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost" className="text-foreground">
                Cost ($)
              </Label>
              <Input
                name="cost"
                id="cost"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="bg-input border-input text-foreground placeholder:text-muted-foreground focus:border-ring px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="odometer" className="text-foreground">
                Odometer (miles)
              </Label>
              <Input
                name="odometer"
                id="odometer"
                type="number"
                placeholder="Current mileage"
                className="bg-input border-input text-foreground placeholder:text-muted-foreground focus:border-ring px-3 py-2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_date" className="text-foreground">
              Date *
            </Label>
            <Input
              name="event_date"
              id="event_date"
              type="date"
              className="bg-input border-input text-foreground focus:border-ring px-3 py-2"
              required
            />
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
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

