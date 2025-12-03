/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { resolveVehicleSlug, isUUID } from '@/lib/vehicle-utils'
import { JobDetailsPageClient } from '@/features/service/components/JobDetailsPageClient'
import { getJobPlan, createJobPlan, getJobSteps } from '@/features/service/actions'

export const revalidate = 0

type JobDetailsPageProps = {
  params: Promise<{ id: string; jobTitle: string }>
}

export default async function JobDetailsPage({ params }: JobDetailsPageProps) {
  const resolvedParams = await params
  const vehicleSlug = decodeURIComponent(resolvedParams.id)
  const jobTitle = decodeURIComponent(resolvedParams.jobTitle)
  const supabase = await createClient()

  if (!vehicleSlug || !jobTitle) {
    notFound()
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect(
      '/auth/signin?message=You must be logged in to view job details.'
    )
  }

  // Resolve vehicle slug to UUID
  const vehicleInfo = await resolveVehicleSlug(vehicleSlug)
  if (!vehicleInfo) {
    notFound()
  }

  const { vehicleId, nickname } = vehicleInfo

  // Redirect to nickname URL if accessed via UUID and vehicle has nickname
  if (nickname && isUUID(vehicleSlug)) {
    redirect(`/vehicle/${encodeURIComponent(nickname)}/service/${encodeURIComponent(jobTitle)}`)
  }

  // Fetch the Vehicle (for context and ownership check)
  const { data: vehicle, error: vehicleError } = await supabase
    .from('user_vehicle')
    .select('id, make, model, year, nickname, odometer')
    .eq('id', vehicleId)
    .eq('owner_id', user.id)
    .single()

  if (vehicleError || !vehicle) {
    notFound()
  }

  // Fetch planned service logs for this job title
  const { data: plannedLogs } = await supabase
    .from('maintenance_log')
    .select(`
      id,
      event_date,
      odometer,
      service_item_id,
      notes,
      service_provider,
      cost,
      service_item:service_items (
        id,
        name
      )
    `)
    .eq('user_vehicle_id', vehicleId)
    .eq('status', 'Plan')
    .order('event_date', { ascending: true })

  // Find the log matching the job title
  const matchingLog = plannedLogs?.find((log: any) => {
    const serviceItem = Array.isArray(log.service_item)
      ? log.service_item[0]
      : log.service_item
    return serviceItem?.name === jobTitle
  })

  if (!matchingLog) {
    notFound()
  }

  // Fetch or create job plan
  let jobPlan = await getJobPlan(matchingLog.id, user.id)

  if (!jobPlan) {
    jobPlan = await createJobPlan(matchingLog.id, user.id, jobTitle)
  }

  // Fetch steps
  const steps = jobPlan ? await getJobSteps(jobPlan.id) : []

  return (
    <JobDetailsPageClient
      vehicle={vehicle}
      jobTitle={jobTitle}
      jobLog={matchingLog}
      userId={user.id}
      initialJobPlan={jobPlan}
      initialSteps={steps}
    />
  )
}
