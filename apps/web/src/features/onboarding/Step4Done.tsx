'use client'

import { Button } from '@repo/ui/button'
import { Check, ArrowRight, X } from 'lucide-react'

interface Step4DoneProps {
  vehicleName: string | null
  completedSteps: Set<number>
  onDone: () => void
  isFinishing: boolean
}

export function Step4Done({ vehicleName, completedSteps, onDone, isFinishing }: Step4DoneProps) {
  const steps = [
    { number: 1, label: 'Vehicle added', detail: vehicleName },
    { number: 2, label: 'Oil change logged' },
    { number: 3, label: 'Service reminder set' },
  ]

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

      <Button onClick={onDone} disabled={isFinishing} className="w-full" size="lg">
        {isFinishing ? 'Loading your garage...' : 'Go to Your Garage'}
        {!isFinishing && <ArrowRight className="w-4 h-4 ml-1" />}
      </Button>
    </div>
  )
}
