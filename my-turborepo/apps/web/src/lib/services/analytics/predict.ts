import { SupabaseClient } from '@supabase/supabase-js'

interface Mod {
  id: string;
  title: string;
  status: string;
  event_date: string;
  user_vehicle_id: string;
}

export interface PredictionResult {
  category: string
  risk: number
  reason: string
  cohortSize: number
}

export interface SurvivalMilesRow {
  category: string
  miles_bin: number
  survival_estimate: number
  cohort_size: number
  year?: number
  make?: string
  model?: string
  trim?: string
  use_case?: string
}

export async function predictUpcomingNeeds(
  supabase: SupabaseClient,
  vehicleId: string
): Promise<PredictionResult[]> {
  // Get vehicle data with installed mods
  const { data: vehicleData, error: vehicleError } = await supabase
    .from('user_vehicle')
    .select(`
      year,
      make,
      model,
      trim,
      current_status,
      odometer,
      mods:mods(
        id,
        title,
        status,
        event_date,
        user_vehicle_id
      )
    `)
    .eq('id', vehicleId)
    .single()

  if (vehicleError || !vehicleData) {
    throw new Error('Vehicle not found')
  }

  const vehicle = {
    ...vehicleData,
    use_case: vehicleData.current_status // Map current_status to use_case
  }

  // Filter installed mods with required data
  const installedMods = vehicle.mods?.filter((mod: Mod) =>
    mod.status === 'installed' &&
    mod.event_date &&
    vehicle.odometer !== null &&
    vehicle.odometer !== undefined
  ) || []

  if (installedMods.length === 0) {
    return []
  }

  const predictions: PredictionResult[] = []

  // Process each installed mod
  for (const mod of installedMods) {
    // Calculate miles since install
    // This is simplified - in reality you'd need to track this more precisely
    const milesSinceInstall = vehicle.odometer || 0
    const targetMiles = milesSinceInstall + 1000

    // Query analytics.survival_miles for nearest miles_bin
    // Note: This assumes analytics.survival_miles exists in the database
    const { data: survivalData, error: survivalError } = await supabase
      .from('analytics.survival_miles')
      .select('*')
      .eq('category', mod.title) // Map mod title to category
      .eq('year', vehicle.year)
      .eq('make', vehicle.make)
      .eq('model', vehicle.model)
      .eq('use_case', vehicle.use_case)
      .order('miles_bin', { ascending: true })

    if (survivalError || !survivalData || survivalData.length === 0) {
      continue
    }

    // Find the nearest miles_bin >= targetMiles
    const nearestRow = survivalData
      .filter(row => row.miles_bin >= targetMiles)
      .sort((a, b) => a.miles_bin - b.miles_bin)[0]

    if (!nearestRow || nearestRow.cohort_size < 25) {
      continue
    }

    // Risk = 1 - survival_estimate
    const risk = Math.max(0, Math.min(1, 1 - nearestRow.survival_estimate))

    predictions.push({
      category: nearestRow.category,
      risk: Math.round(risk * 100) / 100, // Round to 2 decimal places
      reason: `Based on ${nearestRow.cohort_size} similar vehicles`,
      cohortSize: nearestRow.cohort_size
    })
  }

  // Sort by risk (highest first) and limit to 3
  return predictions
    .sort((a, b) => b.risk - a.risk)
    .slice(0, 3)
}
