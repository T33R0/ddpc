'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { Plus } from 'lucide-react'
import { VehicleModsData } from '@/features/mods/lib/getVehicleModsData'
import { ModsPlanner } from '@/features/mods/components/ModsPlanner'
import { InstalledMods } from '@/features/mods/components/InstalledMods'
import { AddModDialog } from '@/features/mods/components/AddModDialog'

interface VehicleModsPageClientProps {
  modsData: VehicleModsData
}

export function VehicleModsPageClient({ modsData }: VehicleModsPageClientProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const router = useRouter()

  const { vehicle, mods } = modsData
  const vehicleId = vehicle.id

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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white">Vehicle Mods</h1>
              <p className="text-lg text-gray-400 mt-2">
                Modifications and upgrades tracking for {vehicle.name}
              </p>
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Mod
            </Button>
          </div>

          <div className="space-y-8">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{modsData.summary.totalMods}</div>
                <div className="text-sm text-gray-400">Total Modifications</div>
              </div>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-400">{modsData.summary.inProgressCount}</div>
                <div className="text-sm text-gray-400">In Progress</div>
              </div>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">{modsData.summary.completedCount}</div>
                <div className="text-sm text-gray-400">Completed</div>
              </div>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-400">${modsData.summary.totalCost.toLocaleString()}</div>
                <div className="text-sm text-gray-400">Total Cost</div>
              </div>
            </div>

            <ModsPlanner mods={mods} />
            <InstalledMods mods={mods} />

            {/* Empty State */}
            {mods.length === 0 && (
              <div className="text-center py-12">
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No Modifications Yet</h3>
                  <p className="text-gray-400 mb-6">
                    Track your vehicle's modifications and upgrades. Start by adding your first mod.
                  </p>
                  <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Mod
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <AddModDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={() => router.refresh()}
        vehicleId={vehicleId}
      />
    </>
  )
}

