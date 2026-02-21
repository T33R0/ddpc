'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Wrench, ChevronRight } from 'lucide-react'
import { logQuickService } from './actions'

interface Step2MaintenanceProps {
  vehicleId: string
  onComplete: (odometer: number) => void
  onSkip: () => void
}

export function Step2Maintenance({ vehicleId, onComplete, onSkip }: Step2MaintenanceProps) {
  const [eventDate, setEventDate] = useState('')
  const [odometer, setOdometer] = useState('')
  const [cost, setCost] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!eventDate) {
      toast.error('Please enter when you last changed your oil')
      return
    }
    if (!odometer || parseInt(odometer) <= 0) {
      toast.error('Please enter your mileage at the time')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await logQuickService(
        vehicleId,
        eventDate,
        parseInt(odometer),
        cost ? parseFloat(cost) : undefined
      )

      if (!result.success) {
        throw new Error(result.error || 'Failed to log service')
      }

      toast.success('Oil change logged!')
      onComplete(parseInt(odometer))
    } catch (error) {
      console.error('Error logging service:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to log service')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <Wrench className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Log Your Last Oil Change</h2>
        <p className="text-sm text-muted-foreground">
          This gives your dashboard a starting point for tracking service history.
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="event-date">When was it?</Label>
          <Input
            id="event-date"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="odometer">Mileage at the time</Label>
          <div className="relative">
            <Input
              id="odometer"
              type="number"
              placeholder="e.g. 45000"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
              min={0}
              className="pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              miles
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cost">
            Cost <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <Input
              id="cost"
              type="number"
              placeholder="0.00"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              min={0}
              step={0.01}
              className="pl-7"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !eventDate || !odometer}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? 'Saving...' : 'Log & Continue'}
          {!isSubmitting && <ChevronRight className="w-4 h-4 ml-1" />}
        </Button>

        <button
          onClick={onSkip}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
          type="button"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
