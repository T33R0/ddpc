'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Fuel } from 'lucide-react'
import { logFuel } from '../actions'
import { FuelLogInputs } from '../schema'

type AddFuelDialogProps = {
  isOpen: boolean
  onClose: () => void
  vehicleId: string
  currentOdometer: number | null
}

interface FormData {
  event_date: string
  odometer: string
  gallons: string
  price_per_gallon: string
}

export function AddFuelDialog({
  isOpen,
  onClose,
  vehicleId,
  currentOdometer,
}: AddFuelDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    event_date: new Date().toISOString().split('T')[0] || '', // YYYY-MM-DD
    odometer: currentOdometer?.toString() || '',
    gallons: '',
    price_per_gallon: '',
  })

  // Sync default values when props change (e.g., modal opens)
  useEffect(() => {
    setFormData({
      event_date: new Date().toISOString().split('T')[0] || '',
      odometer: currentOdometer?.toString() || '',
      gallons: '',
      price_per_gallon: '',
    })
    setError(null)
  }, [isOpen, vehicleId, currentOdometer])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError(null) // Clear error when user starts typing
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Prepare the data matching FuelLogSchema
      const fuelLogData: FuelLogInputs = {
        user_vehicle_id: vehicleId,
        event_date: formData.event_date,
        odometer: parseFloat(formData.odometer),
        gallons: parseFloat(formData.gallons),
        price_per_gallon: parseFloat(formData.price_per_gallon),
      }

      const result = await logFuel(fuelLogData)

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
        throw new Error('Failed to log fuel')
      }

      // Success - reset form and close dialog
      setFormData({
        event_date: new Date().toISOString().split('T')[0] || '',
        odometer: currentOdometer?.toString() || '',
        gallons: '',
        price_per_gallon: '',
      })

      onClose()
      // The server action already revalidates the path, so refresh the router
      router.refresh()

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
            <Fuel className="h-5 w-5" />
            Log Fuel
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Enter the details from your fuel-up. This will also update your
            vehicle's current mileage.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <Label htmlFor="event_date" className="text-gray-300">
              Date *
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
            <Label htmlFor="odometer" className="text-gray-300">
              Odometer (miles) *
            </Label>
            <Input
              id="odometer"
              type="number"
              value={formData.odometer}
              onChange={(e) => handleInputChange('odometer', e.target.value)}
              placeholder="e.g., 60500"
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              required
            />
          </div>

          <div>
            <Label htmlFor="gallons" className="text-gray-300">
              Gallons *
            </Label>
            <Input
              id="gallons"
              type="number"
              step="0.001"
              value={formData.gallons}
              onChange={(e) => handleInputChange('gallons', e.target.value)}
              placeholder="e.g., 12.345"
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              required
            />
          </div>

          <div>
            <Label htmlFor="price_per_gallon" className="text-gray-300">
              Price per Gallon ($) *
            </Label>
            <Input
              id="price_per_gallon"
              type="number"
              step="0.001"
              value={formData.price_per_gallon}
              onChange={(e) => handleInputChange('price_per_gallon', e.target.value)}
              placeholder="e.g., 3.459"
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              required
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? 'Saving...' : 'Save Log'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

