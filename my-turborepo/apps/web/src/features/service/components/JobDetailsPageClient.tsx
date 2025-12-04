'use client'

import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Card, CardContent } from '@repo/ui/card'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { ArrowLeft, Pencil, Check, X } from 'lucide-react'
import { JobPlanBuilder } from './JobPlanBuilder'
import { JobStepData } from './JobStep'
import { useEffect, useState } from 'react'
import { updateJobTitle } from '../actions'

type JobDetailsPageClientProps = {
  vehicle: {
    id: string
    make: string
    model: string
    year: string
    nickname?: string | null
  }
  userId: string
  jobTitle: string
  jobLog: { id: string }
  initialJobPlan?: { id: string; name: string } | null
  initialSteps?: JobStepData[]
}

export function JobDetailsPageClient({
  vehicle,
  jobTitle,
  jobLog,
  userId,
  initialJobPlan,
  initialSteps,
}: JobDetailsPageClientProps) {
  const router = useRouter()
  const vehicleSlug = vehicle.nickname || vehicle.id

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(jobTitle)
  const [isSavingTitle, setIsSavingTitle] = useState(false)

  const handleBack = () => {
    router.push(`/vehicle/${encodeURIComponent(vehicleSlug)}/service`)
  }

  const handleSaveTitle = async () => {
    if (!titleInput.trim() || titleInput === jobTitle || !initialJobPlan?.id) {
      setIsEditingTitle(false)
      setTitleInput(jobTitle)
      return
    }

    setIsSavingTitle(true)
    try {
      const result = await updateJobTitle(initialJobPlan.id, titleInput.trim(), userId)

      if (!result.success) {
        alert(result.error || 'Failed to update title')
        setTitleInput(jobTitle)
      } else {
        // Redirect to new URL
        router.replace(`/vehicle/${encodeURIComponent(vehicleSlug)}/service/${encodeURIComponent(titleInput.trim())}`)
      }
    } catch (error) {
      console.error('Error updating title:', error)
      alert('Failed to update title')
      setTitleInput(jobTitle)
    } finally {
      setIsSavingTitle(false)
      setIsEditingTitle(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle()
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false)
      setTitleInput(jobTitle)
    }
  }

  return (
    <section className="relative py-12 bg-background min-h-screen">
      <div
        aria-hidden="true"
        className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20"
      >
        <div className="blur-[106px] h-56 bg-gradient-to-br from-red-500 to-purple-400" />
        <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300" />
      </div>

      <div className="relative container px-4 md:px-6 pt-24">
        <div className="mb-8">
          <Button
            onClick={handleBack}
            variant="outline"
            className="mb-4 border-border text-muted-foreground hover:bg-muted hover:border-accent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Service
          </Button>
          <h1 className="text-4xl font-bold text-foreground">Job Details</h1>

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
                    setTitleInput(jobTitle)
                  }}
                  disabled={isSavingTitle}
                  className="h-9 w-9 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="group flex items-center gap-2 cursor-pointer"
                onClick={() => setIsEditingTitle(true)}
              >
                <p className="text-lg text-muted-foreground group-hover:text-foreground transition-colors">
                  {jobTitle}
                </p>
                <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="plan" className="w-full text-foreground">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="plan">Job Plan</TabsTrigger>
            <TabsTrigger value="parts">Parts</TabsTrigger>
          </TabsList>

          <TabsContent value="plan" className="mt-6">
            <Card className="bg-card backdrop-blur-sm border-border">
              <CardContent className="p-6">
                {userId && jobLog?.id ? (
                  <JobPlanBuilder
                    maintenanceLogId={jobLog.id}
                    userId={userId}
                    jobTitle={jobTitle}
                    initialJobPlan={initialJobPlan}
                    initialSteps={initialSteps}
                  />
                ) : (
                  <div className="text-muted-foreground">Loading...</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parts" className="mt-6">
            <Card className="bg-card backdrop-blur-sm border-border">
              <CardContent className="p-6">
                <p className="text-muted-foreground">
                  Parts content will be displayed here. This section will show the parts list, quantities, and related information for this service job.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

