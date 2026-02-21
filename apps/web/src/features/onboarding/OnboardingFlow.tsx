'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@repo/ui/card'
import { markOnboardingComplete } from './actions'
import { Step1Vehicle } from './Step1Vehicle'
import { Step2Maintenance } from './Step2Maintenance'
import { Step3Reminder } from './Step3Reminder'
import { Step4Done } from './Step4Done'

const STEPS = [
  { label: 'Add Vehicle', number: 1 },
  { label: 'Log Service', number: 2 },
  { label: 'Set Reminder', number: 3 },
  { label: 'Done', number: 4 },
]

interface OnboardingState {
  step: 1 | 2 | 3 | 4
  vehicleId: string | null
  vehicleName: string | null
  odometer: number | null
  completedSteps: Set<number>
}

export function OnboardingFlow() {
  const router = useRouter()
  const [state, setState] = useState<OnboardingState>({
    step: 1,
    vehicleId: null,
    vehicleName: null,
    odometer: null,
    completedSteps: new Set(),
  })
  const [isFinishing, setIsFinishing] = useState(false)

  const goToStep = (nextStep: 1 | 2 | 3 | 4) => {
    setState((prev) => ({ ...prev, step: nextStep }))
  }

  const handleVehicleComplete = (vehicleId: string, vehicleName: string) => {
    setState((prev) => ({
      ...prev,
      step: 2,
      vehicleId,
      vehicleName,
      completedSteps: new Set([...prev.completedSteps, 1]),
    }))
  }

  const handleMaintenanceComplete = (odometer: number) => {
    setState((prev) => ({
      ...prev,
      step: 3,
      odometer,
      completedSteps: new Set([...prev.completedSteps, 2]),
    }))
  }

  const handleMaintenanceSkip = () => {
    goToStep(3)
  }

  const handleReminderComplete = () => {
    setState((prev) => ({
      ...prev,
      step: 4,
      completedSteps: new Set([...prev.completedSteps, 3]),
    }))
  }

  const handleReminderSkip = () => {
    goToStep(4)
  }

  const handleDone = async () => {
    setIsFinishing(true)
    try {
      const result = await markOnboardingComplete()
      if (result.success) {
        router.push('/garage')
      }
    } catch {
      // If marking complete fails, still redirect — user shouldn't be stuck
      router.push('/garage')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      {/* Logo / Brand */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-primary tracking-tight">DDPC</h1>
        <p className="text-sm text-muted-foreground mt-1">Mission Control for Your Build</p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-lg mb-6">
        <div className="flex items-center gap-1">
          {STEPS.map((s) => (
            <div key={s.number} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className={`h-1.5 w-full rounded-full transition-colors ${
                  s.number <= state.step ? 'bg-primary' : 'bg-muted'
                }`}
              />
              <span
                className={`text-xs hidden sm:block ${
                  s.number === state.step
                    ? 'text-foreground font-medium'
                    : s.number < state.step
                      ? 'text-primary'
                      : 'text-muted-foreground'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className="w-full max-w-lg border-border">
        <CardContent className="p-4 sm:p-6">
          {state.step === 1 && <Step1Vehicle onComplete={handleVehicleComplete} />}

          {state.step === 2 && state.vehicleId && (
            <Step2Maintenance
              vehicleId={state.vehicleId}
              onComplete={handleMaintenanceComplete}
              onSkip={handleMaintenanceSkip}
            />
          )}

          {state.step === 3 && state.vehicleId && (
            <Step3Reminder
              vehicleId={state.vehicleId}
              currentOdometer={state.odometer}
              onComplete={handleReminderComplete}
              onSkip={handleReminderSkip}
            />
          )}

          {state.step === 4 && (
            <Step4Done
              vehicleName={state.vehicleName}
              completedSteps={state.completedSteps}
              onDone={handleDone}
              isFinishing={isFinishing}
            />
          )}
        </CardContent>
      </Card>

      {/* Step counter (mobile) */}
      <p className="mt-4 text-xs text-muted-foreground sm:hidden">
        Step {state.step} of 4
      </p>
    </div>
  )
}
