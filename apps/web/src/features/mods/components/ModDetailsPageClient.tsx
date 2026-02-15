'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@repo/ui/card'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { ArrowLeft, Pencil, Check, X } from 'lucide-react'
import { ModPlanBuilder } from './ModPlanBuilder'
import { ModStepData } from '../types'
import { useEffect, useState } from 'react'
import { updateModPlanName } from '../actions'

type ModDetailsPageClientProps = {
  vehicle: {
    id: string
    make: string
    model: string
    year: string
    nickname?: string | null
  }
  userId: string
  modTitle: string
  modLog: { id: string }
  initialModPlan?: { id: string; name: string } | null
  initialSteps?: ModStepData[]
}

export function ModDetailsPageClient({
  vehicle,
  modTitle,
  modLog,
  userId,
  initialModPlan,
  initialSteps,
}: ModDetailsPageClientProps) {
  const router = useRouter()
  const vehicleSlug = vehicle.nickname || vehicle.id

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(modTitle)
  const [isSavingTitle, setIsSavingTitle] = useState(false)

  const handleBack = () => {
    router.push(`/vehicle/${encodeURIComponent(vehicleSlug)}/mods`)
  }

  const handleSaveTitle = async () => {
    if (!titleInput.trim() || titleInput === modTitle || !initialModPlan?.id) {
      setIsEditingTitle(false)
      setTitleInput(modTitle)
      return
    }

    setIsSavingTitle(true)
    try {
      await updateModPlanName(initialModPlan.id, titleInput.trim(), userId)
      // Since title is likely displayed in the header, we want to reflect it.
      // But unlike Service, the Mod Title might come from the Mod Record itself if we are editing the plan NAME.
      // In Service, Job Title = Plan Name usually.
      // Here, Mod has a title (from item/notes). Mod Plan also has a name.
      // If we update Mod Plan Name, does it update Mod Notes?
      // Service `updateJobTitle` updates `job_plans.name`.
      // The page header uses `jobTitle` which comes from `job_plans.name` usually.

      // We will assume similar behavior: Update plan name, and UI reflects it.
      setIsEditingTitle(false)
      // Force refresh to get new title prop
      router.refresh()
    } catch (error) {
      console.error('Error updating title:', error)
      alert('Failed to update title')
      setTitleInput(modTitle)
      setIsEditingTitle(false)
    } finally {
      setIsSavingTitle(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle()
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false)
      setTitleInput(modTitle)
    }
  }

  return (
    <section className="relative py-12 bg-background min-h-screen">
      <div
        aria-hidden="true"
        className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20"
      >
        <div className="blur-[106px] h-56 bg-gradient-brand" />
        <div className="blur-[106px] h-32 bg-gradient-to-r from-accent to-info" />
      </div>

      <div className="relative container px-4 md:px-6 pt-24">
        <div className="mb-8">
          <Button
            onClick={handleBack}
            variant="outline"
            className="mb-4 border-border text-muted-foreground hover:bg-muted hover:border-accent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Mods
          </Button>

          <div className="mt-2 flex items-center gap-2 h-10">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="text-lg h-9 w-[300px]"
                  disabled={isSavingTitle}
                />
                <Button
                  size="sm"
                  onClick={handleSaveTitle}
                  disabled={isSavingTitle}
                  className="h-9 w-9 p-0"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditingTitle(false)
                    setTitleInput(modTitle)
                  }}
                  disabled={isSavingTitle}
                  className="h-9 w-9 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-4xl font-bold text-foreground">{modTitle}</h1>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingTitle(true)}
                  className="h-8 w-8 p-0 opacity-50 hover:opacity-100 transition-opacity"
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit title</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        <Card className="bg-card backdrop-blur-sm border-border">
          <CardContent className="p-6">
            {userId && modLog?.id ? (
              <ModPlanBuilder
                modLogId={modLog.id}
                userId={userId}
                modTitle={modTitle}
                initialModPlan={initialModPlan}
                initialSteps={initialSteps}
              />
            ) : (
              <div className="text-muted-foreground">Loading...</div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
