'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Textarea } from '@repo/ui/textarea'
import { Plus, Wrench } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useEffect } from 'react'
import { UpcomingService } from '@/features/service/lib/getVehicleServiceData'

interface AddServiceDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  initialData?: UpcomingService | null
  vehicleId: string
}

interface FormData {
  description: string
  service_provider: string
  cost: string
  odometer: string
  event_date: string
  notes: string
  service_interval_id?: string | null
}

export function AddServiceDialog({ isOpen, onClose, onSuccess, initialData, vehicleId }: AddServiceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    description: '',
    service_provider: '',
    cost: '',
    odometer: '',
    event_date: new Date().toISOString().split('T')[0], // Default to today
    notes: '',
    service_interval_id: null,
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        description: initialData.name || '',
        service_provider: '',
        cost: '',
        odometer: '',
        event_date: new Date().toISOString().split('T')[0],
        notes: initialData.description || '',
        service_interval_id: initialData.id,
      })
    } else {
      // Reset form when there's no initial data (for the generic "Add Service" button)
      setFormData({
        description: '',
        service_provider: '',
        cost: '',
        odometer: '',
        event_date: new Date().toISOString().split('T')[0],
        notes: '',
        service_interval_id: null,
      })
    }
  }, [initialData, isOpen]) // Rerun when dialog opens or initialData changes

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError(null) // Clear error when user starts typing
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.description.trim()) {
        throw new Error('Service description is required')
      }
      if (!formData.event_date) {
        throw new Error('Service date is required')
      }

      // Prepare the request data
      const requestData = {
        vehicleId,
        description: formData.description.trim(),
        event_date: formData.event_date,
        odometer: formData.odometer || undefined,
        cost: formData.cost || undefined,
        service_provider: formData.service_provider || undefined,
        notes: formData.notes || undefined,
        service_interval_id: formData.service_interval_id || undefined,
      }

      const response = await fetch('/api/garage/log-service', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to log service')
      }

      // Success - reset form and close dialog
      setFormData({
        description: '',
        service_provider: '',
        cost: '',
        odometer: '',
        event_date: '',
        notes: '',
        service_interval_id: null,
      })

      onClose()
      onSuccess?.() // Notify parent component to refresh data

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
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
            Add Service Record
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <Label htmlFor="description" className="text-gray-300">
              Service Description *
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
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
              value={formData.service_provider}
              onChange={(e) => handleInputChange('service_provider', e.target.value)}
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
                value={formData.cost}
                onChange={(e) => handleInputChange('cost', e.target.value)}
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
                value={formData.odometer}
                onChange={(e) => handleInputChange('odometer', e.target.value)}
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
              value={formData.event_date}
              onChange={(e) => handleInputChange('event_date', e.target.value)}
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
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
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

