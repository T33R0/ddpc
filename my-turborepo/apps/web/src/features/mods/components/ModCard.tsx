import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { Badge } from '@repo/ui/badge'
import { VehicleMod } from '../lib/getVehicleModsData'
import { Calendar, DollarSign, Gauge, Package, CheckCircle, XCircle, Wrench } from 'lucide-react'

interface ModCardProps {
  mod: VehicleMod
  onClick?: (mod: VehicleMod) => void
}

const getStatusBadgeVariant = (status: VehicleMod['status']) => {
  switch (status) {
    case 'planned':
      return 'secondary'
    case 'ordered':
      return 'outline'
    case 'installed':
      return 'default'
    case 'tuned':
      return 'default'
    default:
      return 'secondary'
  }
}

const getStatusIcon = (status: VehicleMod['status']) => {
  switch (status) {
    case 'planned':
      return <Wrench className="h-3 w-3" />
    case 'ordered':
      return <Package className="h-3 w-3" />
    case 'installed':
      return <CheckCircle className="h-3 w-3" />
    case 'tuned':
      return <CheckCircle className="h-3 w-3" />
    default:
      return null
  }
}

export function ModCard({ mod, onClick }: ModCardProps) {
  return (
    <Card
      className={`hover:border-accent transition-colors duration-300 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={() => onClick?.(mod)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">{mod.title}</CardTitle>
            {mod.description && (
              <p className="text-sm text-muted-foreground">{mod.description}</p>
            )}
          </div>
          <Badge variant={getStatusBadgeVariant(mod.status)} className="ml-2 flex items-center gap-1">
            {getStatusIcon(mod.status)}
            {mod.status.charAt(0).toUpperCase() + mod.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {mod.cost && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4 text-primary" />
              <span>${mod.cost.toLocaleString()}</span>
            </div>
          )}
          {mod.odometer && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Gauge className="h-4 w-4 text-primary" />
              <span>{mod.odometer.toLocaleString()} mi</span>
            </div>
          )}
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{mod.event_date.toLocaleDateString()}</span>
        </div>

        {/* Parts */}
        {mod.parts.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Parts Used:</h4>
            <div className="space-y-1">
              {mod.parts.map((part) => (
                <div key={part.id} className="flex items-center justify-between text-sm bg-muted/50 rounded px-2 py-1 border border-border">
                  <div className="flex-1">
                    <span className="text-foreground">{part.name}</span>
                    {part.vendor && (
                      <span className="text-muted-foreground ml-2">({part.vendor})</span>
                    )}
                    {part.quantity > 1 && (
                      <span className="text-muted-foreground ml-2">×{part.quantity}</span>
                    )}
                  </div>
                  {part.cost && (
                    <span className="text-primary font-medium">
                      ${(part.cost * part.quantity).toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Outcome */}
        {mod.outcome && (
          <div className="border-t border-border pt-3">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Outcome:</h4>
            <div className="flex items-center gap-2 text-sm">
              {mod.outcome.success ? (
                <CheckCircle className="h-4 w-4 text-primary" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              <span className={mod.outcome.success ? 'text-primary' : 'text-destructive'}>
                {mod.outcome.success ? 'Successful' : 'Issues Encountered'}
              </span>
            </div>
            {mod.outcome.notes && (
              <p className="text-sm text-muted-foreground mt-1">{mod.outcome.notes}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
