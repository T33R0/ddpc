import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { VehicleMod } from '../lib/getVehicleModsData'
import { ModCard } from './ModCard'
import { CheckCircle, Wrench } from 'lucide-react'

interface InstalledModsProps {
  mods: VehicleMod[]
  vehicleId: string
  onEdit?: (mod: VehicleMod) => void
}

export function InstalledMods({ mods, vehicleId, onEdit }: InstalledModsProps) {
  const installedMods = mods.filter(mod =>
    ['installed', 'tuned'].includes(mod.status)
  )

  if (installedMods.length === 0) {
    return null
  }

  return (
    <Card
      className="bg-card rounded-2xl text-foreground border border-border"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <CheckCircle className="h-5 w-5 text-success" />
          Installed / Tuned
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Completed modifications and performance enhancements
        </p>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {installedMods.map((mod) => (
            <ModCard key={mod.id} mod={mod} vehicleId={vehicleId} onEdit={onEdit} />
          ))}
        </div>

        {installedMods.length === 0 && (
          <div className="text-center py-8">
            <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No completed modifications yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
