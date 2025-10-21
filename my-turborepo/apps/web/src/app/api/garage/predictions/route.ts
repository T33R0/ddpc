import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const querySchema = z.object({
  vehicleId: z.string().uuid()
})

// Mock predictions for testing - replace with actual implementation
const mockPredictions = [
  {
    category: 'Brake Pads',
    risk: 0.75,
    reason: 'Based on 45 similar vehicles',
    cohortSize: 45
  },
  {
    category: 'Oil Filter',
    risk: 0.60,
    reason: 'Based on 32 similar vehicles',
    cohortSize: 32
  },
  {
    category: 'Tires',
    risk: 0.45,
    reason: 'Based on 28 similar vehicles',
    cohortSize: 28
  }
]

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

    // TODO: Replace with actual predictUpcomingNeeds implementation
    // For now, return mock data for testing UI
    const predictions = mockPredictions

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
