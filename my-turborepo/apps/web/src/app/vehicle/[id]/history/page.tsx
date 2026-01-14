import React from 'react'
import { notFound, redirect } from 'next/navigation'
import { TimelineFeed } from '@/features/timeline/components/TimelineFeed'
import { getVehicleEvents, VehicleEvent } from '@/features/timeline/lib/getVehicleEvents'
import { resolveVehicleSlug, isUUID } from '@/lib/vehicle-utils'
import { Card, CardContent } from '@repo/ui/card'
import { Button } from '@repo/ui/button'
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getHistoryFilters } from '@/features/preferences/actions'

interface VehicleHistoryPageProps {
  params: Promise<{ id: string }> // This can be nickname or UUID
}

export default async function VehicleHistoryPage({ params }: VehicleHistoryPageProps) {
  const resolvedParams = await params
  const vehicleSlug = decodeURIComponent(resolvedParams.id)

  if (!vehicleSlug) {
    notFound()
  }

  // Resolve vehicle slug to UUID
  const vehicleInfo = await resolveVehicleSlug(vehicleSlug)
  if (!vehicleInfo) {
    notFound()
  }

  const { vehicleId, nickname } = vehicleInfo

  // Redirect to nickname URL if accessed via UUID and vehicle has nickname
  const isLikelyUUID = isUUID(vehicleSlug)
  if (nickname && isLikelyUUID) {
    redirect(`/vehicle/${encodeURIComponent(nickname)}/history`)
  }

  let events: VehicleEvent[] = []
  let errorMessage: string | null = null

  import { getHistoryFilters } from '@/features/preferences/actions'

  // ...

  try {
    events = await getVehicleEvents(vehicleId) // Use resolved UUID
  } catch (error) {
    console.error('Error fetching vehicle events:', error)
    errorMessage = error instanceof Error ? error.message : 'Failed to load vehicle history'
  }

  const initialFilters = await getHistoryFilters()

  return (
    <>
      <section className="relative py-12 bg-background min-h-screen">
        {/* ... */}
        {errorMessage ? (
          <Card className="max-w-md mx-auto border-destructive/50 mt-12">
            {/* ... */}
          </Card>
        ) : (
          <TimelineFeed events={events} initialFilters={initialFilters} />
        )}
      </div>
    </section >
    </>
  )
}
        </div >
      </section >
    </>
  )
}
