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
  due_date?: Date | null
  due_miles?: number | null
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

  // Fetch user's service intervals for the specific vehicle
  const { data: serviceIntervals, error: intervalsError } = await supabase
    .from('service_intervals')
    .select('id, name, description, interval_months, interval_miles, due_date, due_miles')
    .eq('user_vehicle_id', vehicleId)
    .order('due_date', { ascending: true });

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

  // Calculate upcoming services from service_intervals
  const upcomingServices: UpcomingService[] = serviceIntervals?.map(interval => {
    let isOverdue = false
    if (interval.due_date) {
      isOverdue = new Date(interval.due_date) < new Date()
    }
    if (vehicle.odometer && interval.due_miles) {
      isOverdue = isOverdue || interval.due_miles <= vehicle.odometer
    }

    return {
      id: interval.id,
      name: interval.name,
      description: interval.description || undefined,
      interval_months: interval.interval_months || undefined,
      interval_miles: interval.interval_miles || undefined,
      due_date: interval.due_date ? new Date(interval.due_date) : null,
      due_miles: interval.due_miles || undefined,
      is_overdue: isOverdue,
    }
  }) || []

  // Sort upcoming services by urgency (overdue first, then by next due date)
  upcomingServices.sort((a, b) => {
    if (a.is_overdue && !b.is_overdue) return -1
    if (!a.is_overdue && b.is_overdue) return 1

    // Both overdue or both not - sort by next due date
    const aDate = a.due_date ? a.due_date.getTime() : Infinity
    const bDate = b.due_date ? b.due_date.getTime() : Infinity
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

