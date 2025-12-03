'use client'

import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Card, CardContent } from '@repo/ui/card'
import { Button } from '@repo/ui/button'
import { ArrowLeft } from 'lucide-react'
import { JobPlanBuilder } from './JobPlanBuilder'
import { JobStepData } from './JobStep'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

type JobDetailsPageClientProps = {
  vehicle: {
    id: string
    make: string
    model: string
    year: string
    nickname?: string | null
  }
  jobTitle: string
  jobLog: { id: string }
  initialJobPlan?: { id: string; name: string } | null
  initialSteps?: JobStepData[]
}

export function JobDetailsPageClient({
  vehicle,
  jobTitle,
  jobLog,
  initialJobPlan,
  initialSteps,
}: JobDetailsPageClientProps) {
  const router = useRouter()
  const vehicleSlug = vehicle.nickname || vehicle.id
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUserId()
  }, [])

  const handleBack = () => {
    router.push(`/vehicle/${encodeURIComponent(vehicleSlug)}/service`)
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
          <p className="text-lg text-muted-foreground mt-2">
            {jobTitle}
          </p>
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

