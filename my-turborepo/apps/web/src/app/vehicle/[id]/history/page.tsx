import React from 'react'
import { notFound, redirect } from 'next/navigation'
import { TimelineFeed } from '@/features/timeline/components/TimelineFeed'
import { getVehicleEvents, VehicleEvent } from '@/features/timeline/lib/getVehicleEvents'
import { resolveVehicleSlug, isUUID } from '@/lib/vehicle-utils'
import { Card, CardContent } from '@repo/ui/card'
import { Button } from '@repo/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

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

  try {
    events = await getVehicleEvents(vehicleId) // Use resolved UUID
  } catch (error) {
    console.error('Error fetching vehicle events:', error)
    errorMessage = error instanceof Error ? error.message : 'Failed to load vehicle history'
  }

  return (
    <>
      <section className="relative py-12 bg-background min-h-screen">
        <div
          aria-hidden="true"
          className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20"
        >
          <div className="blur-[106px] h-56 bg-gradient-to-br from-red-500 to-purple-400" />
          <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300" />
        </div>

        <div className="relative container px-4 md:px-6 pt-24">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground">Vehicle History</h1>
            <p className="text-lg text-muted-foreground mt-2">Complete maintenance and ownership history</p>
          </div>

          {errorMessage ? (
            <Card className="max-w-md mx-auto border-destructive/50 mt-12">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load history</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {errorMessage}
                </p>
                <Button asChild variant="outline">
                  <Link href={`/vehicle/${vehicleSlug}/history`}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <TimelineFeed events={events} />
          )}
        </div>
      </section>
    </>
  )
}
