/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import VehicleDashboard from '@/features/vehicle/VehicleDashboard'
import { Vehicle } from '@repo/types'
import { isUUID } from '@/lib/vehicle-utils'
import { getPublicVehicleBySlug } from '@/lib/public-vehicle-utils'
import { VehicleMod } from '@/features/mods/lib/getVehicleModsData'
import { calculateHealth, HealthResult } from '@/features/parts/lib/health'
import { VehicleInstalledComponent } from '@/features/parts/types'

type VehiclePageProps = {
  params: Promise<{
    id: string
  }>
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function VehicleDetailPage({ params }: VehiclePageProps) {
  const supabase = await createClient()
  const resolvedParams = await params
  const vehicleSlug = decodeURIComponent(resolvedParams.id)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user?.id || null

  // --- 1. Fetch Vehicle Data ---
  let isOwner = false
  let vehicle: any = null
  let vehicleError: any = null
  let canonicalSlug: string | null = null

  // Helper to fetch vehicle by ID
  const fetchVehicleById = async (id: string) => {
    return supabase
      .from('user_vehicle')
      .select('*, vehicle_data ( * )')
      .eq('id', id)
      .maybeSingle()
  }

  if (userId) {
    const { resolveVehicleSlug } = await import('@/lib/vehicle-utils')
    const resolved = await resolveVehicleSlug(vehicleSlug, supabase, user)

    if (resolved) {
      const { data, error } = await fetchVehicleById(resolved.vehicleId)
      if (data) {
        if (data.owner_id === userId) {
          vehicle = data
          isOwner = true
          vehicleError = error
          canonicalSlug = resolved.canonicalSlug
        }
      }
    }
  }

  if (!vehicle) {
    const publicVehicleData = await getPublicVehicleBySlug(vehicleSlug)
    if (publicVehicleData) {
      vehicle = publicVehicleData
      vehicleError = null
      isOwner = userId ? vehicle.owner_id === userId : false
    }
  }

  if (!vehicle) {
    notFound()
  }

  // --- 2. Fetch Dashboard Data ---

  // We need:
  // - Latest Odometer
  // - ALL Maintenance Logs (for Logbook)
  // - ALL Fuel Logs (for Logbook)
  // - ALL Mods (for Build & Workshop)
  // - Next Service Due

  const vehicleId = vehicle.id

  const [
    odometerRes,
    maintenanceRes,
    fuelRes,
    modsRes,
    serviceIntervalsRes,
    primaryImageRes,
    jobsRes,
    partsRes
  ] = await Promise.all([
    // Latest Odometer
    supabase.from('odometer_log').select('reading_mi').eq('user_vehicle_id', vehicleId).order('recorded_at', { ascending: false }).limit(1).single(),
    // Maintenance Logs
    supabase.from('maintenance_log').select('*').eq('user_vehicle_id', vehicleId).order('event_date', { ascending: false }),
    // Fuel Logs
    supabase.from('fuel_log').select('*').eq('user_vehicle_id', vehicleId).order('event_date', { ascending: false }),
    // Mods
    supabase.from('mods').select('*, mod_item:mod_items(name, description)').eq('user_vehicle_id', vehicleId),
    // Service Intervals (Next Due)
    supabase.from('service_intervals').select('due_date').eq('user_vehicle_id', vehicleId).gt('due_date', new Date().toISOString()).order('due_date', { ascending: true }).limit(1).maybeSingle(),
    // Stock Image
    vehicle.vehicle_data?.id ? supabase.from('vehicle_primary_image').select('url').eq('vehicle_id', vehicle.vehicle_data.id).maybeSingle() : Promise.resolve({ data: null }),
    // Jobs (Recent Logic)
    supabase.from('jobs').select('*').eq('vehicle_id', vehicleId).eq('status', 'completed').order('date_completed', { ascending: false }),
    // Installed Parts (for Logbook)
    supabase.from('inventory').select('*, part:master_parts(*)').eq('vehicle_id', vehicleId).eq('status', 'installed').order('installed_at', { ascending: false })
  ])

  // --- 3. Process Data ---
  const maintenanceLogs = maintenanceRes.data || []
  const fuelLogs = fuelRes.data || []
  const jobs = jobsRes.data || []
  const partsLogs = partsRes.data || []

  // Stats
  // User explicitly requested 'odometer' from user_vehicle table
  const latestOdometer = vehicle.odometer || odometerRes.data?.reading_mi || 0
  const avgMpg = vehicle.avg_mpg ? Number(vehicle.avg_mpg) : null
  const lastServiceDate = maintenanceLogs[0]?.event_date || null
  const lastFuelDate = fuelLogs[0]?.event_date || null
  const nextServiceDate = serviceIntervalsRes.data?.due_date || null

  const mappedMods: VehicleMod[] = (modsRes.data || []).map((m: any) => {
    const modItem = m.mod_item
    // Fallback title/desc logic similar to getVehicleModsData
    let title = 'Modification'
    let description = undefined
    if (modItem && modItem.name) {
      title = modItem.name
      description = m.notes || modItem.description
    } else if (m.notes) {
      const lines = m.notes.split('\n')
      title = lines[0]
      description = lines.slice(1).join('\n') || undefined
    }

    return {
      id: m.id,
      title,
      description,
      status: m.status,
      cost: m.cost,
      odometer: m.odometer,
      event_date: new Date(m.event_date || m.created_at || Date.now()),
      parts: [], // Not fetching parts for generic dashboard view
      outcome: undefined
    }
  })

  // Determine completed mods based on logic
  const completedMods = mappedMods.filter((m) => ['installed', 'tuned'].includes(m.status))
  const totalCompletedMods = completedMods.length
  const totalCompletedModCost = completedMods.reduce((sum, m) => sum + (Number(m.cost) || 0), 0)

  // Total Records
  const totalRecords = maintenanceLogs.length + fuelLogs.length + mappedMods.length

  // Construct Logs Unified Feed
  const rawLogs = [
    ...maintenanceLogs.map((l: any) => ({
      type: 'service',
      date: l.event_date,
      title: l.description || 'Service Record',
      description: l.notes,
      cost: l.cost,
      id: l.id,
      odometer: l.odometer
    })),
    ...fuelLogs.map((l: any) => ({
      type: 'fuel',
      date: l.event_date,
      title: 'Fuel Up',
      description: `${l.gallons} gal @ $${l.price_per_gallon}/gal`,
      cost: l.total_cost,
      id: l.id,
      odometer: l.odometer
    })),
    ...mappedMods.filter((m) => ['installed', 'tuned', 'active'].includes(m.status)).map((m) => ({
      type: 'mod',
      date: m.event_date.toISOString(),
      title: m.title || `Installed Part`,
      description: m.description,
      cost: m.cost,
      id: m.id,
      odometer: m.odometer,
      status: m.status
    })),
    ...partsLogs.map((p: any) => ({
      type: 'part',
      date: p.installed_at || p.created_at,
      title: p.part?.name || p.name || 'Installed Part',
      description: p.part?.description || p.description,
      cost: p.purchase_price,
      id: p.id,
      odometer: p.install_miles,
      status: 'installed',
      category: p.part?.category || p.category,
      part_number: p.part?.part_number,
      variant: p.variant || p.variant_name
    })),
    ...jobs.map((j: any) => ({
      type: 'job',
      date: j.date_completed,
      title: j.title || 'Completed Job',
      description: j.notes,
      cost: j.cost_total,
      id: j.id,
      odometer: j.odometer,
      status: 'completed'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // --- 4. Calculate Inventory Health Stats ---
  const installedParts = partsLogs.map((p: any) => ({
    ...p,
    // Ensure shape matches VehicleInstalledComponent as expected by calculateHealth
    // calculateHealth expects: { install_miles, installed_at, lifespan_miles, lifespan_months, ... }
    // p includes joined 'part' data.
    lifespan_miles: p.lifespan_miles || p.part?.default_lifespan_miles,
    lifespan_months: p.lifespan_months || p.part?.default_lifespan_months,
  }))

  let totalHealthScore = 0
  let scorablePartsCount = 0
  let partsNeedingAttention = 0

  installedParts.forEach((part: any) => {
    // Construct a minimal definition object for the 2nd arg
    const definition = {
      default_lifespan_miles: part.part?.default_lifespan_miles,
      default_lifespan_months: part.part?.default_lifespan_months
    } as any

    const health: HealthResult = calculateHealth(part as VehicleInstalledComponent, definition, latestOdometer)

    if (health.status !== 'Unknown') {
      // health.percentageUsed is "Used %". We want "Health %" (100 - Used).
      const currentHealth = Math.max(0, 100 - health.percentageUsed)
      totalHealthScore += currentHealth
      scorablePartsCount++

      if (health.status === 'Warning' || health.status === 'Critical') {
        partsNeedingAttention++
      }
    }
  })

  const averageHealthScore = scorablePartsCount > 0 ? Math.round(totalHealthScore / scorablePartsCount) : null

  const inventoryHealth = {
    totalParts: installedParts.length,
    healthScore: averageHealthScore,
    partsNeedingAttention,
    partsNeedingAttentionList: installedParts
        .map((part: any) => {
            const definition = {
                default_lifespan_miles: part.part?.default_lifespan_miles,
                default_lifespan_months: part.part?.default_lifespan_months
            } as any
            const health = calculateHealth(part as VehicleInstalledComponent, definition, latestOdometer)
            return {
                id: part.id,
                name: part.part?.name || part.name,
                status: health.status,
                healthPercentage: Math.max(0, 100 - health.percentageUsed),
                part_number: part.part?.part_number
            }
        })
        .filter((p: any) => p.status === 'Warning' || p.status === 'Critical') as Array<{ id: string; name: string; status: 'Warning' | 'Critical'; healthPercentage: number; part_number?: string }>
  }

  // Recent Activity (Up to 21 for infinite scroll)
  const recentActivity = rawLogs.slice(0, 21)

  // Vehicle Object Construction
  const vehicleWithData: Vehicle = {
    ...vehicle,
    // Ensure all required fields from Vehicle type are present or defaulted
    name: vehicle.nickname || vehicle.title || vehicleSlug || 'Unnamed Vehicle',
    stock_image: primaryImageRes.data?.url || null,
    vehicle_image: vehicle.vehicle_image || null,
    current_status: vehicle.current_status || 'inactive',
    privacy: vehicle.privacy || 'PRIVATE',
  }

  // Flatten vehicle_data properties if needed (Vehicle type might expect them at top level)
  // The existing `vehicle` object from `user_vehicle` usually has them.
  // If `Vehicle` type requires flattened properties, we might need to copy them over. 
  // Based on previous code, they seemed to be flattened manually. Let's do a quick flattening.
  if (vehicle.vehicle_data) {
    const { id: _, ...vehicleDataWithoutId } = vehicle.vehicle_data
    // Merge vehicle_data but ensure user_vehicle properties take precedence
    Object.assign(vehicleWithData, { ...vehicleDataWithoutId, ...vehicle })
  }

  // --- 4. Redirects ---
  if (isOwner && canonicalSlug && vehicleSlug !== canonicalSlug) {
    redirect(`/vehicle/${encodeURIComponent(canonicalSlug)}`)
  } else if (!isOwner && !vehicle.nickname && !isUUID(vehicleSlug) && vehicleSlug !== vehicle.id) {
    redirect(`/vehicle/${encodeURIComponent(vehicle.id)}`)
  }

  return (
    <VehicleDashboard
      vehicle={vehicleWithData}
      isOwner={isOwner}
      stats={{
        odometer: latestOdometer,
        serviceCount: maintenanceLogs.length,
        avgMpg,
        lastServiceDate,
        lastFuelDate,
        nextServiceDate,
        totalCompletedMods,
        totalCompletedModCost,
        horsepower: vehicleWithData.horsepower_hp ? Number(vehicleWithData.horsepower_hp) : null,
        torque: vehicleWithData.torque_ft_lbs ? Number(vehicleWithData.torque_ft_lbs) : null,
        factoryMpg: vehicleWithData.epa_combined_mpg ? Number(vehicleWithData.epa_combined_mpg) :
          (vehicleWithData as any).combined_mpg ? Number((vehicleWithData as any).combined_mpg) :
            ((vehicleWithData as any).city_mpg && (vehicleWithData as any).highway_mpg) ?
              (Number((vehicleWithData as any).city_mpg) + Number((vehicleWithData as any).highway_mpg)) / 2 : undefined,
        engine_size_l: vehicleWithData.engine_size_l || null,
        cylinders: vehicleWithData.cylinders || null,
        drive_type: vehicleWithData.drive_type || null,
        fuel_type: vehicleWithData.fuel_type || null,
        vehicle_color: (vehicleWithData as any).vehicle_color || (vehicleWithData as any).color || null,
        acquisition_date: (vehicleWithData as any).acquisition_date || null,
        ownership_end_date: (vehicleWithData as any).ownership_end_date || null,
        vin: (vehicleWithData as any).vin || null,
        record_count: totalRecords
      }}
      inventoryStats={inventoryHealth}
      recentActivity={recentActivity}
      totalLogsCount={rawLogs.length}
      mods={mappedMods}
      logs={rawLogs}
    />
  )
}
