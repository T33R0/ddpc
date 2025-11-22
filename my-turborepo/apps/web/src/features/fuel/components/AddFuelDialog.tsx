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
  trip_miles: string
  octane: string
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
    trip_miles: '',
    octane: '',
  })

  // Sync default values when props change (e.g., modal opens)
  useEffect(() => {
    setFormData({
      event_date: new Date().toISOString().split('T')[0] || '',
      odometer: currentOdometer?.toString() || '',
      gallons: '',
      price_per_gallon: '',
      trip_miles: '',
      octane: '',
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
        trip_miles: formData.trip_miles ? parseFloat(formData.trip_miles) : null,
        octane: formData.octane ? parseFloat(formData.octane) : null,
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
        trip_miles: '',
        octane: '',
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
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            Log Fuel
          </DialogTitle>
          <DialogDescription>
            Enter the details from your fuel-up. This will also update your
            vehicle's current mileage.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="px-6 pb-6 space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="event_date">
              Date *
            </Label>
            <Input
              id="event_date"
              type="date"
              value={formData.event_date}
              onChange={(e) => handleInputChange('event_date', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="odometer">
              Odometer (miles) *
            </Label>
            <Input
              id="odometer"
              type="number"
              value={formData.odometer}
              onChange={(e) => handleInputChange('odometer', e.target.value)}
              placeholder="e.g., 60500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gallons">
              Gallons *
            </Label>
            <Input
              id="gallons"
              type="number"
              step="0.001"
              value={formData.gallons}
              onChange={(e) => handleInputChange('gallons', e.target.value)}
              placeholder="e.g., 12.345"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price_per_gallon">
              Price per Gallon ($) *
            </Label>
            <Input
              id="price_per_gallon"
              type="number"
              step="0.001"
              value={formData.price_per_gallon}
              onChange={(e) => handleInputChange('price_per_gallon', e.target.value)}
              placeholder="e.g., 3.459"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trip_miles">
              Trip Miles (optional)
            </Label>
            <Input
              id="trip_miles"
              type="number"
              step="0.1"
              value={formData.trip_miles}
              onChange={(e) => handleInputChange('trip_miles', e.target.value)}
              placeholder="e.g., 350.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave blank to calculate automatically from previous fuel-up
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="octane">
              Octane Rating (optional)
            </Label>
            <Input
              id="octane"
              type="number"
              step="1"
              value={formData.octane}
              onChange={(e) => handleInputChange('octane', e.target.value)}
              placeholder="e.g., 87, 91, 93"
            />
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Log'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

