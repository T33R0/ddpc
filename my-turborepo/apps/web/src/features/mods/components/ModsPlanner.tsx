import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { VehicleMod } from '../lib/getVehicleModsData'
import { ModCard } from './ModCard'
import { Clock, AlertCircle } from 'lucide-react'

interface ModsPlannerProps {
  mods: VehicleMod[]
}

export function ModsPlanner({ mods }: ModsPlannerProps) {
  const inProgressMods = mods.filter(mod =>
    ['planned', 'ordered'].includes(mod.status)
  )

  if (inProgressMods.length === 0) {
    return null
  }

  return (
    <Card
      className="bg-card rounded-2xl text-foreground border border-border"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Clock className="h-5 w-5 text-yellow-500" />
          In Progress
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Modifications currently planned or ordered
        </p>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {inProgressMods.map((mod) => (
            <ModCard key={mod.id} mod={mod} />
          ))}
        </div>

        {inProgressMods.length === 0 && (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No modifications in progress</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

