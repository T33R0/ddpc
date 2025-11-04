import React from 'react'
import { notFound } from 'next/navigation'
import { TimelineFeed } from '@/features/timeline/components/TimelineFeed'
import { getVehicleEvents, VehicleEvent } from '@/features/timeline/lib/getVehicleEvents'

interface VehicleHistoryPageProps {
  params: Promise<{ id: string }>
}

export default async function VehicleHistoryPage({ params }: VehicleHistoryPageProps) {
  const { id: vehicleId } = await params

  if (!vehicleId) {
    notFound()
  }

  let events: VehicleEvent[] = []
  try {
    events = await getVehicleEvents(vehicleId)
  } catch (error) {
    console.error('Error fetching vehicle events:', error)
    // For now, we'll show an empty state if there's an error
    // TODO: Add proper error handling UI
  }

  return (
    <>
      <section className="relative py-12 bg-black min-h-screen">
        <div
          aria-hidden="true"
          className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20"
        >
          <div className="blur-[106px] h-56 bg-gradient-to-br from-red-500 to-purple-400" />
          <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300" />
        </div>

        <div className="relative container px-4 md:px-6 pt-24">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white">Vehicle History</h1>
            <p className="text-lg text-gray-400 mt-2">Complete maintenance and ownership history</p>
          </div>

          <TimelineFeed events={events} />
        </div>
      </section>
    </>
  )
}
