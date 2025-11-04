import { createClient } from '@/lib/supabase/server'

export interface ServiceHistoryItem {
  id: string
  description: string
  cost?: number
  odometer?: number
  event_date: Date
  notes?: string
  service_provider?: string
  service_interval_id?: string
}

export interface UpcomingService {
  id: string
  name: string
  description?: string
  interval_months?: number
  interval_miles?: number
  last_service_date?: Date
  last_service_odometer?: number
  next_due_date?: Date
  next_due_miles?: number
  is_overdue: boolean
}

export interface VehicleServiceData {
  vehicle: {
    id: string
    name: string
    ymmt: string
    odometer?: number
  }
  serviceHistory: ServiceHistoryItem[]
  upcomingServices: UpcomingService[]
}

export async function getVehicleServiceData(vehicleId: string): Promise<VehicleServiceData> {
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  // Fetch vehicle info
  const { data: vehicle, error: vehicleError } = await supabase
    .from('user_vehicle')
    .select('id, name, ymmt, odometer')
    .eq('id', vehicleId)
    .eq('owner_id', user.id)
    .single()

  if (vehicleError || !vehicle) {
    throw new Error('Vehicle not found or access denied')
  }

  // Fetch maintenance logs (service history)
  const { data: maintenanceLogs, error: maintenanceError } = await supabase
    .from('maintenance_log')
    .select('id, description, cost, odometer, event_date, notes, service_provider, service_interval_id')
    .eq('user_vehicle_id', vehicleId)
    .order('event_date', { ascending: false })

  if (maintenanceError) {
    console.error('Error fetching maintenance logs:', maintenanceError)
    throw new Error('Failed to fetch maintenance data')
  }

  // Fetch user's service intervals
  const { data: serviceIntervals, error: intervalsError } = await supabase
    .from('service_intervals')
    .select('id, name, interval_months, interval_miles, description')
    .eq('user_id', user.id)

  if (intervalsError) {
    console.error('Error fetching service intervals:', intervalsError)
    throw new Error('Failed to fetch service intervals')
  }

  // Transform maintenance logs
  const serviceHistory: ServiceHistoryItem[] = maintenanceLogs?.map(log => ({
    id: log.id,
    description: log.description,
    cost: log.cost || undefined,
    odometer: log.odometer || undefined,
    event_date: new Date(log.event_date),
    notes: log.notes || undefined,
    service_provider: log.service_provider || undefined,
    service_interval_id: log.service_interval_id || undefined,
  })) || []

  // Calculate upcoming services
  const upcomingServices: UpcomingService[] = []

  if (serviceIntervals) {
    for (const interval of serviceIntervals) {
      // Find the last maintenance for this interval
      const lastService = maintenanceLogs
        ?.filter(log => log.service_interval_id === interval.id)
        ?.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())[0]

      const lastServiceDate = lastService ? new Date(lastService.event_date) : null
      const lastServiceOdometer = lastService?.odometer || null

      // Calculate next due date and miles
      let nextDueDate: Date | null = null
      let nextDueMiles: number | null = null
      let isOverdue = false

      if (lastServiceDate && interval.interval_months) {
        nextDueDate = new Date(lastServiceDate)
        nextDueDate.setMonth(nextDueDate.getMonth() + interval.interval_months)
        isOverdue = nextDueDate < new Date()
      }

      if (lastServiceOdometer && interval.interval_miles) {
        nextDueMiles = lastServiceOdometer + interval.interval_miles
        isOverdue = isOverdue || (vehicle.odometer && nextDueMiles !== null && nextDueMiles <= vehicle.odometer)
      }

      // If no last service exists, calculate from vehicle creation or assume now
      if (!lastService) {
        // For new intervals with no history, we'll show them as upcoming
        // This could be enhanced to show "initial service due" logic
        continue // Skip intervals with no service history for now
      }

      upcomingServices.push({
        id: interval.id,
        name: interval.name,
        description: interval.description || undefined,
        interval_months: interval.interval_months || undefined,
        interval_miles: interval.interval_miles || undefined,
        last_service_date: lastServiceDate || undefined,
        last_service_odometer: lastServiceOdometer || undefined,
        next_due_date: nextDueDate || undefined,
        next_due_miles: nextDueMiles || undefined,
        is_overdue: isOverdue,
      })
    }
  }

  // Sort upcoming services by urgency (overdue first, then by next due date)
  upcomingServices.sort((a, b) => {
    if (a.is_overdue && !b.is_overdue) return -1
    if (!a.is_overdue && b.is_overdue) return 1

    // Both overdue or both not - sort by next due date
    const aDate = a.next_due_date ? a.next_due_date.getTime() : Infinity
    const bDate = b.next_due_date ? b.next_due_date.getTime() : Infinity
    return aDate - bDate
  })

  return {
    vehicle: {
      id: vehicle.id,
      name: vehicle.name,
      ymmt: vehicle.ymmt,
      odometer: vehicle.odometer || undefined,
    },
    serviceHistory,
    upcomingServices,
  }
}

