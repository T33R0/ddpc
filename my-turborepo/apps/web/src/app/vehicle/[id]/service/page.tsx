import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { ServicePageClient } from '@/features/service/ServicePageClient'
import { ServiceInterval, MaintenanceLog } from '@repo/types'

export const revalidate = 0; // Ensure data is always fresh

type ServicePageProps = {
  params: Promise<{ id: string }> // This is the user_vehicle_id
}

export default async function VehicleServicePage({ params }: ServicePageProps) {
  const { id: vehicleId } = await params
  const supabase = await createClient()

  if (!vehicleId) {
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

  // --- 1. Fetch the Vehicle (for context and ownership check) ---
  const { data: vehicle, error: vehicleError } = await supabase
    .from('user_vehicle')
    .select('id, make, model, year, nickname')
    .eq('id', vehicleId)
    .eq('owner_id', user.id) // CRITICAL: Ownership check
    .single()

  if (vehicleError || !vehicle) {
    notFound() // Triggers 404 page
  }

  // --- 2. Fetch the "Plan" (from service_intervals) ---
  const { data: plan, error: planError } = await supabase
    .from('service_intervals')
    .select(
      `
      *,
      master_service_schedule (
        description
      )
    `
    )
    .eq('user_vehicle_id', vehicle.id)
    .order('interval_miles', { ascending: true })

  if (planError) {
    console.error('Error fetching service plan:', planError)
    // We can still render the page, just with an empty plan
  }

  // --- 3. Fetch the "History" (from maintenance_log) ---
  // We'll fix the "future date" bug here.
  const { data: history, error: historyError } = await supabase
    .from('maintenance_log')
    .select('*')
    .eq('user_vehicle_id', vehicle.id)
    .lte('event_date', new Date().toISOString()) // Only show items from today or the past
    .order('event_date', { ascending: false })

  if (historyError) {
    console.error('Error fetching service history:', historyError)
  }

  // --- 4. Fetch "Scheduled" (Future items from maintenance_log) ---
  // This separates future items and adds them to the "Plan" view
  const { data: scheduled, error: scheduledError } = await supabase
    .from('maintenance_log')
    .select('*')
    .eq('user_vehicle_id', vehicle.id)
    .gt('event_date', new Date().toISOString()) // Only show future items
    .order('event_date', { ascending: true })

  if (scheduledError) {
    console.error('Error fetching scheduled services:', scheduledError)
  }

  // --- 5. Pass all data to the Client Component ---
  return (
    <ServicePageClient
      vehicle={vehicle}
      initialPlan={
        (plan as ServiceInterval[] | null) || []
      }
      initialHistory={
        (history as MaintenanceLog[] | null) || []
      }
      initialScheduled={
        (scheduled as MaintenanceLog[] | null) || []
      }
    />
  )
}
