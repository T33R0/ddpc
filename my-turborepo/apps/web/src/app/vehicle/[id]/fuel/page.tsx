import React from 'react'
import { notFound } from 'next/navigation'
import { FuelStatsCard } from '@/features/fuel/components/FuelStatsCard'
import { FuelHistoryChart } from '@/features/fuel/components/FuelHistoryChart'
import { AddFuelEntryDialog } from '@/features/fuel/components/AddFuelEntryDialog'
import { getVehicleFuelData } from '@/features/fuel/lib/getVehicleFuelData'

interface VehicleFuelPageProps {
  params: Promise<{ id: string }>
}

export default async function VehicleFuelPage({ params }: VehicleFuelPageProps) {
  const { id: vehicleId } = await params

  if (!vehicleId) {
    notFound()
  }

  let fuelData
  try {
    fuelData = await getVehicleFuelData(vehicleId)
  } catch (error) {
    console.error('Error fetching fuel data:', error)
    // For now, show empty state if there's an error
    fuelData = null
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
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white">Vehicle Fuel</h1>
              <p className="text-lg text-gray-400 mt-2">Fuel economy and consumption tracking</p>
            </div>
            <AddFuelEntryDialog vehicleId={vehicleId} />
          </div>

          {fuelData ? (
            <div className="space-y-6">
              {/* Vehicle Info Header */}
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{fuelData.vehicle.name}</h2>
                    <p className="text-gray-400">{fuelData.vehicle.ymmt}</p>
                  </div>
                  <div className="text-right">
                    {fuelData.vehicle.fuelType && (
                      <p className="text-sm text-gray-400">Fuel Type: <span className="text-white">{fuelData.vehicle.fuelType}</span></p>
                    )}
                    {fuelData.vehicle.factoryMpg && (
                      <p className="text-sm text-gray-400">EPA Rating: <span className="text-blue-400 font-semibold">{fuelData.vehicle.factoryMpg} MPG</span></p>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <FuelStatsCard stats={fuelData.stats} />

              {/* Chart */}
              <FuelHistoryChart
                fuelEntries={fuelData.fuelEntries}
                factoryMpg={fuelData.vehicle.factoryMpg}
              />

              {/* Empty State for no data */}
              {!fuelData.hasData && (
                <div className="text-center py-8 bg-gray-900/50 border border-gray-700 rounded-lg">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No Fuel Data Yet</h3>
                  <p className="text-gray-400 max-w-md mx-auto">
                    Start tracking your fuel efficiency by adding your first fuel entry.
                    This will help you monitor your MPG, fuel costs, and overall vehicle efficiency.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Unable to Load Fuel Data</h3>
              <p className="text-gray-400">
                There was an error loading your fuel data. Please try again later.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
