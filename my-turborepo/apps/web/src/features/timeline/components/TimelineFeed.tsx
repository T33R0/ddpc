'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { VehicleEvent } from '../lib/getVehicleEvents'
import { HistoryDetailSheet } from './HistoryDetailSheet'
import { Wrench, Zap, Gauge, History, Fuel } from 'lucide-react'

// Icon components for different event types
function FuelIcon() {
  return (
    <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
      <Fuel className="w-4 h-4 text-red-400" />
    </div>
  )
}

function MaintenanceIcon() {
  return (
    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
      <Wrench className="w-4 h-4 text-cyan-400" />
    </div>
  )
}

function ModificationIcon() {
  return (
    <div className="w-8 h-8 bg-lime-500/20 rounded-full flex items-center justify-center">
      <Zap className="w-4 h-4 text-lime-400" />
    </div>
  )
}

function MileageIcon() {
  return (
    <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
      <Gauge className="w-4 h-4 text-orange-400" />
    </div>
  )
}

function getEventIcon(type: VehicleEvent['type']) {
  switch (type) {
    case 'maintenance':
      return <MaintenanceIcon />
    case 'modification':
      return <ModificationIcon />
    case 'mileage':
      return <MileageIcon />
    case 'fuel':
      return <FuelIcon />
    default:
      return <MaintenanceIcon />
  }
}

function getEventTypeLabel(type: VehicleEvent['type']) {
  switch (type) {
    case 'maintenance':
      return 'Maintenance'
    case 'modification':
      return 'Modification'
    case 'mileage':
      return 'Mileage Update'
    case 'fuel':
      return 'Fuel Log'
    default:
      return 'Event'
  }
}

function getEventTypeColor(type: VehicleEvent['type']) {
  switch (type) {
    case 'maintenance':
      return 'text-cyan-400'
    case 'modification':
      return 'text-lime-400'
    case 'mileage':
      return 'text-orange-400'
    case 'fuel':
      return 'text-red-400'
    default:
      return 'text-muted-foreground'
  }
}

interface TimelineFeedProps {
  events: VehicleEvent[]
}

export function TimelineFeed({ events }: TimelineFeedProps) {
  const [selectedEvent, setSelectedEvent] = useState<VehicleEvent | null>(null)

  if (events.length === 0) {
    return (
      <Card className="bg-card rounded-2xl text-foreground border border-border">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No History Yet</h3>
          <p className="text-muted-foreground">
            Vehicle history will appear here once you add maintenance records, modifications, or mileage updates.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {events.map((event) => (
          <Card
            key={event.id}
            onClick={() => setSelectedEvent(event)}
            className="bg-card rounded-2xl text-foreground hover:bg-accent/5 transition-colors border border-border cursor-pointer active:scale-[0.99]"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  {getEventIcon(event.type)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`text-sm font-bold ${getEventTypeColor(event.type)}`}>
                        {getEventTypeLabel(event.type)}
                      </span>
                      {event.status && event.type === 'modification' && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                          {event.status}
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-lg font-bold text-foreground mb-1">
                      {event.title}
                    </CardTitle>
                    {event.description && (
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm text-muted-foreground font-medium">
                    {event.date.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                  {event.odometer && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {event.odometer.toLocaleString()} miles
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            {(event.cost !== undefined && event.cost > 0) && (
              <CardContent className="pt-0">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Cost:</span>
                  <span className="text-sm font-semibold text-foreground">
                    ${event.cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <HistoryDetailSheet
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </>
  )
}
