'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Bell, ChevronRight } from 'lucide-react'
import { setQuickReminder } from './actions'

interface Step3ReminderProps {
  vehicleId: string
  currentOdometer: number | null
  onComplete: () => void
  onSkip: () => void
}

export function Step3Reminder({
  vehicleId,
  currentOdometer,
  onComplete,
  onSkip,
}: Step3ReminderProps) {
  const [milesUntilDue, setMilesUntilDue] = useState('3000')
  const [monthsUntilDue, setMonthsUntilDue] = useState('3')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    const miles = parseInt(milesUntilDue) || 0
    const months = parseInt(monthsUntilDue) || 0

    if (miles === 0 && months === 0) {
      toast.error('Please set at least a mileage or time interval')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await setQuickReminder(
        vehicleId,
        currentOdometer || 0,
        miles,
        months
      )

      if (!result.success) {
        throw new Error(result.error || 'Failed to set reminder')
      }

      toast.success('Reminder set!')
      onComplete()
    } catch (error) {
      console.error('Error setting reminder:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to set reminder')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Set a Reminder</h2>
        <p className="text-sm text-muted-foreground">
          When should your next oil change happen? We&apos;ll track it for you.
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="miles-due">Next oil change in</Label>
          <div className="relative">
            <Input
              id="miles-due"
              type="number"
              value={milesUntilDue}
              onChange={(e) => setMilesUntilDue(e.target.value)}
              min={0}
              className="pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              miles
            </span>
          </div>
          {currentOdometer !== null && currentOdometer > 0 && (
            <p className="text-xs text-muted-foreground">
              That&apos;s at{' '}
              {(currentOdometer + (parseInt(milesUntilDue) || 0)).toLocaleString()} miles
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="months-due">Next oil change in</Label>
          <div className="relative">
            <Input
              id="months-due"
              type="number"
              value={monthsUntilDue}
              onChange={(e) => setMonthsUntilDue(e.target.value)}
              min={0}
              max={24}
              className="pr-16"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              months
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-md bg-muted/50 border border-border p-3">
        <p className="text-xs text-muted-foreground">
          Most manufacturers recommend oil changes every 3,000\u20135,000 miles or every 3\u20136
          months (whichever comes first). Synthetic oil can go 7,500\u201310,000 miles.
        </p>
      </div>

      <div className="space-y-2">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? 'Setting Reminder...' : 'Set Reminder & Finish'}
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
