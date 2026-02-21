'use client'

import { useState } from 'react'
import { Button } from '@repo/ui/button'
import { Check, ArrowRight, X, Bell } from 'lucide-react'
import { setServiceRemindersOptIn } from './actions'

interface Step4DoneProps {
  vehicleName: string | null
  completedSteps: Set<number>
  onDone: () => void
  isFinishing: boolean
}

export function Step4Done({ vehicleName, completedSteps, onDone, isFinishing }: Step4DoneProps) {
  const [remindersEnabled, setRemindersEnabled] = useState(true)
  const [isSavingPreference, setIsSavingPreference] = useState(false)

  const steps = [
    { number: 1, label: 'Vehicle added', detail: vehicleName },
    { number: 2, label: 'Oil change logged' },
    { number: 3, label: 'Service reminder set' },
  ]

  const handleDone = async () => {
    // Save the email preference before completing onboarding
    setIsSavingPreference(true)
    try {
      await setServiceRemindersOptIn(remindersEnabled)
    } catch {
      // Non-blocking — don't prevent onboarding completion
      console.error('[Step4Done] Failed to save reminder preference')
    } finally {
      setIsSavingPreference(false)
    }
    onDone()
  }

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <Check className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">You&apos;re All Set!</h2>
        <p className="text-sm text-muted-foreground">
          Your garage is ready. Here&apos;s what we set up:
        </p>
      </div>

      <div className="space-y-2">
        {steps.map((step) => {
          const isCompleted = completedSteps.has(step.number)
          return (
            <div
              key={step.number}
              className="flex items-center gap-3 rounded-md border border-border p-3"
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isCompleted
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm ${
                    isCompleted ? 'text-foreground font-medium' : 'text-muted-foreground'
                  }`}
                >
                  {isCompleted ? step.label : `${step.label} (skipped)`}
                </p>
                {step.detail && isCompleted && (
                  <p className="text-xs text-muted-foreground truncate">{step.detail}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Steward Activation — Email Reminder Opt-In */}
      <div className="rounded-lg border border-border bg-card/50 p-4">
        <button
          type="button"
          onClick={() => setRemindersEnabled(!remindersEnabled)}
          className="flex items-start gap-3 w-full text-left"
        >
          <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
            remindersEnabled
              ? 'bg-primary border-primary text-primary-foreground'
              : 'border-input bg-background'
          }`}>
            {remindersEnabled && <Check className="w-3 h-3" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-sm font-medium text-foreground">
                Email me when service is due
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Get a weekly digest when maintenance is approaching or overdue. You can change this anytime in account settings.
            </p>
          </div>
        </button>
      </div>

      <Button
        onClick={handleDone}
        disabled={isFinishing || isSavingPreference}
        className="w-full"
        size="lg"
      >
        {isFinishing || isSavingPreference ? 'Loading your garage...' : 'Go to Your Garage'}
        {!isFinishing && !isSavingPreference && <ArrowRight className="w-4 h-4 ml-1" />}
      </Button>
    </div>
  )
}
