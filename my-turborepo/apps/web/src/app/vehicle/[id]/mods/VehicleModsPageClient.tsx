'use client'

import React, { useState } from 'react'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { Badge } from '@repo/ui/badge'
import { Plus, Wrench, DollarSign, Activity } from 'lucide-react'
import { VehicleModsData } from '@/features/mods/lib/getVehicleModsData'
import { ModsPlanner } from '@/features/mods/components/ModsPlanner'
import { InstalledMods } from '@/features/mods/components/InstalledMods'
import { AddModDialog } from '@/features/mods/components/AddModDialog'

interface VehicleModsPageClientProps {
  modsData: VehicleModsData
}

export function VehicleModsPageClient({ modsData }: VehicleModsPageClientProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const { vehicle, mods, summary } = modsData

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

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Wrench className="h-8 w-8 text-blue-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{summary.totalMods}</p>
                    <p className="text-sm text-gray-400">Total Mods</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-green-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">${summary.totalCost.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">Total Cost</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Activity className="h-8 w-8 text-yellow-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{summary.inProgressCount}</p>
                    <p className="text-sm text-gray-400">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Badge className="h-8 w-8 bg-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-white">{summary.completedCount}</p>
                    <p className="text-sm text-gray-400">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mods Sections */}
          <div className="space-y-8">
            <ModsPlanner mods={mods} />
            <InstalledMods mods={mods} />
          </div>

          {/* Empty State */}
          {mods.length === 0 && (
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="text-center py-16">
                <Wrench className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Modifications Yet</h3>
                <p className="text-gray-400 mb-6">
                  Start tracking your vehicle's modifications and upgrades.
                </p>
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Mod
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <AddModDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
      />
    </>
  )
}
