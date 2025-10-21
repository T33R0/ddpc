import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const querySchema = z.object({
  vehicleId: z.string().uuid()
})

interface PredictionResult {
  category: string
  risk: number
  reason: string
  cohortSize: number
}

interface SurvivalMilesRow {
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

async function predictUpcomingNeeds(
  supabase: any,
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
  const installedMods = vehicle.mods?.filter((mod: any) =>
    mod.status === 'installed' &&
    mod.event_date &&
    vehicle.odometer !== null &&
    vehicle.odometer !== undefined
  ) || []

  if (installedMods.length === 0) {
    return [] // Return empty array to trigger nudge
  }

  const predictions: PredictionResult[] = []

  // Process each installed mod
  for (const mod of installedMods) {
    // Calculate miles since install
    const milesSinceInstall = vehicle.odometer || 0
    const targetMiles = milesSinceInstall + 1000

    // Query analytics.survival_miles for nearest miles_bin
    const { data: survivalData, error: survivalError } = await supabase
      .from('analytics.survival_miles')
      .select('*')
      .eq('category', mod.title)
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
      .filter((row: SurvivalMilesRow) => row.miles_bin >= targetMiles)
      .sort((a: SurvivalMilesRow, b: SurvivalMilesRow) => a.miles_bin - b.miles_bin)[0]

    if (!nearestRow || nearestRow.cohort_size < 25) {
      continue
    }

    // Risk = 1 - survival_estimate
    const risk = Math.max(0, Math.min(1, 1 - nearestRow.survival_estimate))

    predictions.push({
      category: nearestRow.category,
      risk: Math.round(risk * 100) / 100,
      reason: `Based on ${nearestRow.cohort_size} similar vehicles`,
      cohortSize: nearestRow.cohort_size
    })
  }

  // Sort by risk (highest first) and limit to 3
  return predictions
    .sort((a, b) => b.risk - a.risk)
    .slice(0, 3)
}

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate query params
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')

    if (!vehicleId) {
      return NextResponse.json(
        { error: 'Vehicle ID is required' },
        { status: 400 }
      )
    }

    const validationResult = querySchema.safeParse({ vehicleId })
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid vehicle ID' },
        { status: 400 }
      )
    }

    // Check if user owns the vehicle
    const { data: vehicle, error: vehicleError } = await supabase
      .from('user_vehicle')
      .select('owner_id')
      .eq('id', vehicleId)
      .single()

    if (vehicleError || !vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    if (vehicle.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get predictions
    const predictions = await predictUpcomingNeeds(supabase, vehicleId)

    // Return 204 if no predictions, 200 with data otherwise
    if (predictions.length === 0) {
      return new NextResponse(null, { status: 204 })
    }

    return NextResponse.json({ predictions })
  } catch (error) {
    console.error('Error fetching predictions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
