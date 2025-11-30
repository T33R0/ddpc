/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { ServicePageClient } from '@/features/service/ServicePageClient'
import { ServiceInterval, MaintenanceLog } from '@repo/types'
import { resolveVehicleSlug } from '@/lib/vehicle-utils'

export const revalidate = 0; // Ensure data is always fresh

type ServicePageProps = {
  params: Promise<{ id: string }> // This can be nickname or UUID
}

export default async function VehicleServicePage({ params }: ServicePageProps) {
  const resolvedParams = await params
  const vehicleSlug = decodeURIComponent(resolvedParams.id)
  const supabase = await createClient()

  if (!vehicleSlug) {
    notFound()
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect(
      '/auth/signin?message=You must be logged in to view a vehicle service page.'
    )
  }

  // --- 1. Resolve vehicle slug to UUID ---
  const vehicleInfo = await resolveVehicleSlug(vehicleSlug, supabase, user)
  if (!vehicleInfo) {
    notFound() // Triggers 404 page
  }

  const { vehicleId, canonicalSlug } = vehicleInfo

  // Redirect to canonical URL if needed
  if (canonicalSlug && vehicleSlug !== canonicalSlug) {
    redirect(`/vehicle/${encodeURIComponent(canonicalSlug)}/service`)
  }

  // --- 2. Fetch the Vehicle (for context and ownership check) ---
  const { data: vehicle, error: vehicleError } = await supabase
    .from('user_vehicle')
    .select('id, make, model, year, nickname, odometer')
    .eq('id', vehicleId) // Use resolved UUID
    .eq('owner_id', user.id) // CRITICAL: Ownership check
    .single()

  if (vehicleError || !vehicle) {
    notFound() // Triggers 404 page
  }

  // --- 3-5. Fetch plan, history, and scheduled entries in parallel ---
  const [
    planResult,
    historyResult,
    plannedLogsResult,
    scheduledResult,
    serviceCategoriesResult,
    serviceItemsResult,
  ] = await Promise.all([
    supabase
      .from('service_intervals')
      .select('*')
      .eq('user_vehicle_id', vehicleId)
      .order('interval_miles', { ascending: true }),
    supabase
      .from('maintenance_log')
      .select(`
        id,
        event_date,
        odometer,
        service_item_id,
        notes,
        service_provider,
        cost,
        status,
        service_item:service_items (
          id,
          name
        )
      `)
      .eq('user_vehicle_id', vehicleId)
      .or('status.eq.History,status.is.null')
      .order('event_date', { ascending: false }),
    supabase
      .from('maintenance_log')
      .select(`
        id,
        event_date,
        odometer,
        service_item_id,
        notes,
        service_provider,
        cost,
        status,
        service_item:service_items (
          id,
          name
        )
      `)
      .eq('user_vehicle_id', vehicleId)
      .eq('status', 'Plan')
      .order('event_date', { ascending: true }),
    supabase
      .from('maintenance_log')
      .select('*')
      .eq('user_vehicle_id', vehicleId)
      .gt('event_date', new Date().toISOString())
      .order('event_date', { ascending: true }),
    supabase
      .from('service_categories')
      .select('id, name')
      .order('name', { ascending: true }),
    supabase
      .from('service_items')
      .select('id, name, description, category_id')
      .order('name', { ascending: true }),
  ])

  const { data: plan, error: planError } = planResult
  const { data: history, error: historyError } = historyResult
  const { data: scheduled, error: scheduledError } = scheduledResult
  const { data: plannedLogs, error: plannedLogsError } = plannedLogsResult
  const { data: serviceCategories, error: serviceCategoriesError } = serviceCategoriesResult
  const { data: serviceItems, error: serviceItemsError } = serviceItemsResult

  if (planError) {
    console.error('Error fetching service plan:', planError)
  }

  if (historyError) {
    console.error('Error fetching service history:', historyError)
  }

  if (scheduledError) {
    console.error('Error fetching scheduled services:', scheduledError)
  }

  if (plannedLogsError) {
    console.error('Error fetching planned logs:', plannedLogsError)
  }

  if (serviceCategoriesError) {
    console.error('Error fetching service categories:', serviceCategoriesError)
  }

  if (serviceItemsError) {
    console.error('Error fetching service items:', serviceItemsError)
  }

  // --- 6. Pass all data to the Client Component ---
  return (
    <ServicePageClient
      vehicle={vehicle}
      initialPlannedLogs={(plannedLogs as any[] | null) || []}
      initialPlan={
        (plan as ServiceInterval[] | null) || []
      }
      initialHistory={
        (history as MaintenanceLog[] | null) || []
      }
      initialScheduled={
        (scheduled as MaintenanceLog[] | null) || []
      }
      initialChecklistCategories={(serviceCategories as any[] | null) || []}
      initialChecklistItems={(serviceItems as any[] | null) || []}
    />
  )
}
