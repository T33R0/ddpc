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
            <ModsPlanner mods={mods} />
            <InstalledMods mods={mods} />
          </div>
        </div>
      </section>

      <AddModDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </>
  )
}

