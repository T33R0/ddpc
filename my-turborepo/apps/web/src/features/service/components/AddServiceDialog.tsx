'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Textarea } from '@repo/ui/textarea'
import { Plus, Wrench } from 'lucide-react'
import { ServiceInterval } from '@repo/types'
import { logPlannedService, logFreeTextService } from '../actions'
import { ServiceLogInputs } from '../schema'

interface AddServiceDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  planItem?: ServiceInterval | null // Changed from initialData to planItem
  vehicleId: string
}

interface FormData {
  description: string
  service_provider: string
  cost: string
  odometer: string
  event_date: string
  notes: string
  plan_item_id?: string | null // Changed from service_interval_id to plan_item_id
}

export function AddServiceDialog({ isOpen, onClose, onSuccess, planItem, vehicleId }: AddServiceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    description: '',
    service_provider: '',
    cost: '',
    odometer: '',
    event_date: new Date().toISOString().split('T')[0]!, // Default to today
    notes: '',
    plan_item_id: null,
  })

  useEffect(() => {
    if (planItem) {
      // Pre-populate form for "guided" mode (planned service)
      setFormData({
        description: planItem.name || '',
        service_provider: '',
        cost: '',
        odometer: '',
        event_date: new Date().toISOString().split('T')[0]!,
        notes: planItem.description || planItem.master_service_schedule?.description || '',
        plan_item_id: planItem.id,
      })
    } else {
      // Reset form for "free-text" mode
      setFormData({
        description: '',
        service_provider: '',
        cost: '',
        odometer: '',
        event_date: new Date().toISOString().split('T')[0]!,
        notes: '',
        plan_item_id: null,
      })
    }
  }, [planItem, isOpen]) // Reset on open or when planItem changes

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

      // Prepare the data matching ServiceLogSchema
      const serviceLogData: ServiceLogInputs = {
        user_vehicle_id: vehicleId,
        description: formData.description.trim(),
        event_date: formData.event_date,
        ...(formData.service_provider?.trim() && { service_provider: formData.service_provider.trim() }),
        ...(formData.cost && formData.cost.trim() && !isNaN(parseFloat(formData.cost)) && { cost: parseFloat(formData.cost) }),
        ...(formData.odometer && formData.odometer.trim() && !isNaN(parseFloat(formData.odometer)) && { odometer: parseFloat(formData.odometer) }),
        ...(formData.notes?.trim() && { notes: formData.notes.trim() }),
        ...(formData.plan_item_id && formData.plan_item_id.trim() && { plan_item_id: formData.plan_item_id }),
      }

      // Call the appropriate action based on whether it's a planned service
      let result
      if (planItem) {
        // "Guided" mode - two-write operation
        result = await logPlannedService(serviceLogData)
      } else {
        // "Free-text" mode - single-write operation
        result = await logFreeTextService(serviceLogData)
      }

      if (result.error) {
        // If there are validation details, show them
        if (result.details && Array.isArray(result.details)) {
          const errorMessages = result.details.map((err: { message?: string; path?: (string | number)[] }) => {
            const field = err.path?.map(String).join('.') || 'field'
            return `${field}: ${err.message || 'Invalid value'}`
          }).join(', ')
          throw new Error(`${result.error} ${errorMessages}`)
        }
        throw new Error(result.error)
      }

      if (!result.success) {
        throw new Error('Failed to log service')
      }

      // Success - reset form and close dialog
      setFormData({
        description: '',
        service_provider: '',
        cost: '',
        odometer: '',
        event_date: new Date().toISOString().split('T')[0]!,
        notes: '',
        plan_item_id: null,
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
      <DialogContent 
        className="bg-black/50 backdrop-blur-lg max-w-md text-white p-0"
        style={{
          border: '1px solid rgba(255, 255, 255, 0.3)',
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Wrench className="h-5 w-5" />
            Add Service Record
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Log a new service item. Fill in the details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {error && (
            <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-300">
              Service Description *
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="e.g., Oil change, brake pads replacement"
              className="bg-black/30 backdrop-blur-sm border-white/20 text-white placeholder-gray-400 focus:border-white/40 px-3 py-2"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_provider" className="text-gray-300">
              Service Provider
            </Label>
            <Input
              id="service_provider"
              value={formData.service_provider}
              onChange={(e) => handleInputChange('service_provider', e.target.value)}
              placeholder="e.g., Dealership, Local Shop"
              className="bg-black/30 backdrop-blur-sm border-white/20 text-white placeholder-gray-400 focus:border-white/40 px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
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
                className="bg-black/30 backdrop-blur-sm border-white/20 text-white placeholder-gray-400 focus:border-white/40 px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="odometer" className="text-gray-300">
                Odometer (miles)
              </Label>
              <Input
                id="odometer"
                type="number"
                value={formData.odometer}
                onChange={(e) => handleInputChange('odometer', e.target.value)}
                placeholder="Current mileage"
                className="bg-black/30 backdrop-blur-sm border-white/20 text-white placeholder-gray-400 focus:border-white/40 px-3 py-2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_date" className="text-gray-300">
              Service Date *
            </Label>
            <Input
              id="event_date"
              type="date"
              value={formData.event_date}
              onChange={(e) => handleInputChange('event_date', e.target.value)}
              className="bg-black/30 backdrop-blur-sm border-white/20 text-white focus:border-white/40 px-3 py-2"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-gray-300">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional details about the service..."
              className="bg-black/30 backdrop-blur-sm border-white/20 text-white placeholder-gray-400 min-h-[80px] px-3 py-2 focus:border-white/40"
            />
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-white/20 text-gray-300 hover:bg-black/30 hover:border-white/30"
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

