/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { resolveVehicleSlug, isUUID } from '@/lib/vehicle-utils'
import { JobDetailsPageClient } from '@/features/service/components/JobDetailsPageClient'

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
      ),
      job_plans (
        id,
        name
      )
    `)
    .eq('user_vehicle_id', vehicleId)
    .eq('status', 'Plan')
    .order('event_date', { ascending: true })

  // Find the log matching the job title
  const matchingLog = plannedLogs?.find((log: any) => {
    // Check if job plan name matches
    if (log.job_plans?.[0]?.name === jobTitle) return true

    // Fallback: Check if service item name matches (only if no custom job plan name exists or if it matches service item name)
    const serviceItem = Array.isArray(log.service_item)
      ? log.service_item[0]
      : log.service_item
    return serviceItem?.name === jobTitle
  })

  if (!matchingLog) {
    notFound()
  }

  // Fetch or create Job Plan
  let jobPlanId = null
  let jobPlanName = null
  let jobSteps: any[] = []

  // Try to find existing job plan for this maintenance log
  const { data: existingPlan } = await supabase
    .from('job_plans')
    .select('id, name')
    .eq('maintenance_log_id', matchingLog.id)
    .eq('user_id', user.id)
    .single()

  if (existingPlan) {
    jobPlanId = existingPlan.id
    jobPlanName = existingPlan.name
  } else {
    // If no plan exists, create one
    const { data: newPlan, error: createError } = await supabase
      .from('job_plans')
      .insert({
        user_id: user.id,
        maintenance_log_id: matchingLog.id,
        name: jobTitle,
      })
      .select('id, name')
      .single()

    if (!createError && newPlan) {
      jobPlanId = newPlan.id
      jobPlanName = newPlan.name
    } else {
      console.error('Error creating job plan:', createError)
    }
  }

  // Fetch steps if we have a job plan
  if (jobPlanId) {
    const { data: steps } = await supabase
      .from('job_steps')
      .select('*')
      .eq('job_plan_id', jobPlanId)
      .order('step_order', { ascending: true })

    if (steps) {
      jobSteps = steps
    }
  }

  return (
    <JobDetailsPageClient
      vehicle={vehicle}
      jobTitle={jobTitle}
      jobLog={matchingLog}
      userId={user.id}
      initialJobPlan={jobPlanId ? { id: jobPlanId, name: jobPlanName || jobTitle } : null}
      initialSteps={jobSteps}
    />
  )
}
