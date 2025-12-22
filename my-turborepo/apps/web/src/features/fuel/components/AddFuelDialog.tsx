'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@repo/ui/modal'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Fuel, Trash2 } from 'lucide-react'
import { logFuel, updateFuelLog, deleteFuelLog } from '../actions'
import { FuelLogInputs } from '../schema'
import { FuelEntry } from '../lib/getVehicleFuelData'

type AddFuelDialogProps = {
  isOpen: boolean
  onClose: () => void
  vehicleId: string
  currentOdometer: number | null
  initialData?: FuelEntry | null
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
  initialData,
}: AddFuelDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    event_date: new Date().toISOString().split('T')[0] || '', // YYYY-MM-DD
    odometer: currentOdometer?.toString() || '',
    gallons: '',
    price_per_gallon: '',
    trip_miles: '',
    octane: '',
  })

  const isEditMode = !!initialData

  // Sync values when props change
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          event_date: new Date(initialData.date).toISOString().split('T')[0] || '',
          odometer: initialData.odometer.toString(),
          gallons: initialData.gallons.toString(),
          price_per_gallon: initialData.cost ? (initialData.cost / initialData.gallons).toFixed(3) : '',
          trip_miles: initialData.trip_miles?.toString() || '',
          octane: '', // Still missing from basic FuelEntry view, acceptable to leave blank
        })
      } else {
        setFormData({
          event_date: new Date().toISOString().split('T')[0] || '',
          odometer: currentOdometer?.toString() || '',
          gallons: '',
          price_per_gallon: '',
          trip_miles: '',
          octane: '',
        })
      }
      setError(null)
      setShowDeleteConfirm(false)
    }
  }, [isOpen, vehicleId, currentOdometer, initialData])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError(null) // Clear error when user starts typing
  }

  async function handleDelete() {
    setIsSubmitting(true)
    try {
      if (!initialData?.id) return
      const result = await deleteFuelLog(initialData.id, vehicleId)
      if (result.error) throw new Error(result.error)

      onClose()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
      setIsSubmitting(false)
    }
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

      let result
      if (isEditMode && initialData?.id) {
        result = await updateFuelLog(initialData.id, fuelLogData)
      } else {
        result = await logFuel(fuelLogData)
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
        throw new Error('Failed to save log')
      }

      onClose()
      // The server action already revalidates the path, so refresh the router
      router.refresh()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showDeleteConfirm) {
    return (
      <Modal open={isOpen} onOpenChange={onClose}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Delete Fuel Log?</ModalTitle>
            <ModalDescription>
              Are you sure you want to delete this fuel log entry? This will recalculate your vehicle&apos;s average MPG. This action cannot be undone.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isSubmitting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete Log'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    )
  }

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="sm:max-w-lg p-0">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            {isEditMode ? 'Edit Fuel Log' : 'Log Fuel'}
          </ModalTitle>
          <ModalDescription>
            {isEditMode
              ? 'Update the details of your fuel-up.'
              : 'Enter the details from your fuel-up. This will also update your vehicle\'s current mileage.'}
          </ModalDescription>
        </ModalHeader>

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
              inputMode="numeric"
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
              inputMode="decimal"
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
              inputMode="decimal"
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
              inputMode="decimal"
              value={formData.trip_miles}
              onChange={(e) => handleInputChange('trip_miles', e.target.value)}
              placeholder="e.g., 350.5"
            />
            {!isEditMode && (
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank to calculate automatically from previous fuel-up
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="octane">
              Octane Rating (optional)
            </Label>
            <Input
              id="octane"
              type="number"
              step="1"
              inputMode="numeric"
              value={formData.octane}
              onChange={(e) => handleInputChange('octane', e.target.value)}
              placeholder="e.g., 87, 91, 93"
            />
          </div>

          <ModalFooter className="gap-2 pt-4 flex justify-between">
            {isEditMode ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            ) : <div />}

            <div className="flex gap-2">
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
                {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Log' : 'Save Log')}
              </Button>
            </div>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
