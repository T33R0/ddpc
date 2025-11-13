import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { VehicleMod } from '../lib/getVehicleModsData'
import { ModCard } from './ModCard'
import { CheckCircle, Wrench } from 'lucide-react'

interface InstalledModsProps {
  mods: VehicleMod[]
}

export function InstalledMods({ mods }: InstalledModsProps) {
  const installedMods = mods.filter(mod =>
    ['installed', 'tuned'].includes(mod.status)
  )

  if (installedMods.length === 0) {
    return null
  }

  return (
    <Card 
      className="bg-black/50 backdrop-blur-lg rounded-2xl text-white"
      style={{
        border: '1px solid rgba(255, 255, 255, 0.3)',
      }}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <CheckCircle className="h-5 w-5 text-green-400" />
          Installed / Tuned
        </CardTitle>
        <p className="text-sm text-gray-400">
          Completed modifications and performance enhancements
        </p>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {installedMods.map((mod) => (
            <ModCard key={mod.id} mod={mod} />
          ))}
        </div>

        {installedMods.length === 0 && (
          <div className="text-center py-8">
            <Wrench className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No completed modifications yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

