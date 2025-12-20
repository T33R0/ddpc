'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { Plus, ArchiveRestore, Archive } from 'lucide-react'
import { VehicleModsData, VehicleMod } from '@/features/mods/lib/getVehicleModsData'
import { ModsPlanner } from '@/features/mods/components/ModsPlanner'
import { InstalledMods } from '@/features/mods/components/InstalledMods'
import { AddModDialog } from '@/features/mods/components/AddModDialog'
import { EditModDialog } from '@/features/mods/components/EditModDialog'
import { ModCard } from '@/features/mods/components/ModCard'

interface VehicleModsPageClientProps {
  modsData: VehicleModsData
}

export function VehicleModsPageClient({ modsData }: VehicleModsPageClientProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedMod, setSelectedMod] = useState<VehicleMod | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const router = useRouter()

  const { vehicle, mods } = modsData
  const vehicleId = vehicle.id

  const activeMods = mods.filter(m => m.status !== 'archived')
  const archivedMods = mods.filter(m => m.status === 'archived')

  const handleModClick = (mod: VehicleMod) => {
    setSelectedMod(mod)
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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Vehicle Mods</h1>
              <p className="text-lg text-muted-foreground mt-2">
                Modifications and upgrades tracking for {vehicle.name}
              </p>
            </div>
            <div className="flex gap-2">
              {archivedMods.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowArchived(!showArchived)}
                  className="bg-background"
                >
                  {showArchived ? (
                    <>
                      <Archive className="h-4 w-4 mr-2" />
                      Hide Archived
                    </>
                  ) : (
                    <>
                      <ArchiveRestore className="h-4 w-4 mr-2" />
                      Show Archived
                    </>
                  )}
                </Button>
              )}
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Mod
              </Button>
            </div>
          </div>

          <div className="space-y-8">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div
                className="bg-card rounded-2xl p-4 text-foreground border border-border"
              >
                <div className="text-2xl font-bold text-foreground">{modsData.summary.totalMods}</div>
                <div className="text-sm text-muted-foreground">Total Modifications</div>
              </div>
              <div
                className="bg-card rounded-2xl p-4 text-foreground border border-border"
              >
                <div className="text-2xl font-bold text-yellow-500">{modsData.summary.inProgressCount}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div
                className="bg-card rounded-2xl p-4 text-foreground border border-border"
              >
                <div className="text-2xl font-bold text-green-500">{modsData.summary.completedCount}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div
                className="bg-card rounded-2xl p-4 text-foreground border border-border"
              >
                <div className="text-2xl font-bold text-blue-500">${modsData.summary.totalCost.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Cost</div>
              </div>
            </div>

            <ModsPlanner mods={activeMods} onModClick={handleModClick} />
            <InstalledMods mods={activeMods} onModClick={handleModClick} />

            {/* Archived Section */}
            {showArchived && archivedMods.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-border">
                <h2 className="text-2xl font-semibold text-muted-foreground">Archived Mods</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-80">
                  {archivedMods.map((mod) => (
                    <ModCard key={mod.id} mod={mod} onClick={handleModClick} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {mods.length === 0 && (
              <div className="text-center py-12">
                <div
                  className="bg-card rounded-2xl p-8 max-w-md mx-auto text-foreground border border-border"
                >
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Modifications Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Track your vehicle&apos;s modifications and upgrades. Start by adding your first mod.
                  </p>
                  <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
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

      <EditModDialog
        isOpen={!!selectedMod}
        onClose={() => setSelectedMod(null)}
        onSuccess={() => {
          setSelectedMod(null)
          router.refresh()
        }}
        vehicleId={vehicleId}
        mod={selectedMod}
      />
    </>
  )
}
