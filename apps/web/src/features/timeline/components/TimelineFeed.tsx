'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { VehicleEvent } from '../lib/getVehicleEvents'
import { HistoryDetailSheet } from './HistoryDetailSheet'
import { Wrench, Zap, Gauge, History, Fuel, Package, Briefcase } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@repo/ui/toggle-group'
import { updateHistoryFilters } from '@/features/preferences/actions'
import { useRouter } from 'next/navigation'

// ... existing icons ...

interface TimelineFeedProps {
  events: VehicleEvent[]
  initialFilters?: string[]
}

// Icon components for different event types
function FuelIcon({ className }: { className?: string }) {
  return (
    <div className={`w-8 h-8 bg-destructive/20 rounded-full flex items-center justify-center ${className}`}>
      <Fuel className="w-4 h-4 text-destructive" />
    </div>
  )
}

function JobIcon({ className }: { className?: string }) {
  return (
    <div className={`w-8 h-8 bg-info/20 rounded-full flex items-center justify-center ${className}`}>
      <Wrench className="w-4 h-4 text-info" />
    </div>
  )
}

function PartIcon({ className }: { className?: string }) {
  return (
    <div className={`w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center ${className}`}>
      <Package className="w-4 h-4 text-accent" />
    </div>
  )
}

function MaintenanceIcon({ className }: { className?: string }) {
  return (
    <div className={`w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center ${className}`}>
      <Wrench className="w-4 h-4 text-accent" />
    </div>
  )
}

function ModificationIcon({ className }: { className?: string }) {
  return (
    <div className={`w-8 h-8 bg-success/20 rounded-full flex items-center justify-center ${className}`}>
      <Zap className="w-4 h-4 text-success" />
    </div>
  )
}

function MileageIcon({ className }: { className?: string }) {
  return (
    <div className={`w-8 h-8 bg-warning/20 rounded-full flex items-center justify-center ${className}`}>
      <Gauge className="w-4 h-4 text-warning" />
    </div>
  )
}

function getEventIcon(type: VehicleEvent['type']) {
  switch (type) {
    case 'job':
      return <JobIcon />
    case 'part':
      return <PartIcon />
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
    case 'job':
      return 'Job'
    case 'part':
      return 'Part'
    case 'maintenance':
      return 'Service'
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
    case 'job':
      return 'text-info'
    case 'part':
      return 'text-accent'
    case 'maintenance':
      return 'text-accent'
    case 'modification':
      return 'text-success'
    case 'mileage':
      return 'text-warning'
    case 'fuel':
      return 'text-destructive'
    default:
      return 'text-muted-foreground'
  }
}

interface TimelineFeedProps {
  events: VehicleEvent[]
  initialFilters?: string[]
}

export function TimelineFeed({ events, initialFilters = ['job', 'fuel', 'part'] }: TimelineFeedProps) {
  const router = useRouter()
  const [selectedEvent, setSelectedEvent] = useState<VehicleEvent | null>(null)
  const [activeFilters, setActiveFilters] = useState<string[]>(initialFilters)

  const handleFilterChange = (value: string[]) => {
    setActiveFilters(value)
    updateHistoryFilters(value).catch(err => console.error('Failed to save filter preference', err))
  }

  const filteredEvents = events.filter(event => activeFilters.includes(event.type))

  if (events.length === 0) {
    return (
      <Card className="bg-card rounded-2xl text-foreground border border-border">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No History Yet</h3>
          <p className="text-muted-foreground">
            Vehicle history will appear here once you add jobs, parts, or fuel logs.
          </p>
        </CardContent>
      </Card>
    )
  }

  const handleToggle = (value: string) => {
    let newFilters;
    if (activeFilters.includes(value)) {
      newFilters = activeFilters.filter(f => f !== value);
    } else {
      newFilters = [...activeFilters, value];
    }
    handleFilterChange(newFilters);
  };

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto gap-2 no-scrollbar hide-scrollbar">
          {/* Note: In a real app the list of toggles could be dynamic. Hardcoding the 3 for now. */}
          <button
            type="button"
            onClick={() => handleToggle('fuel')}
            className={`h-10 px-4 rounded-full border transition-all flex items-center justify-center text-sm font-medium whitespace-nowrap shrink-0 
              ${activeFilters.includes('fuel')
                ? 'bg-secondary/10 text-secondary border-secondary shadow-sm'
                : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'}`}
          >
            <Fuel className="w-4 h-4 mr-2" />
            Fuel
          </button>

          <button
            type="button"
            onClick={() => handleToggle('job')}
            className={`h-10 px-4 rounded-full border transition-all flex items-center justify-center text-sm font-medium whitespace-nowrap shrink-0 
              ${activeFilters.includes('job')
                ? 'bg-secondary/10 text-secondary border-secondary shadow-sm'
                : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'}`}
          >
            <Wrench className="w-4 h-4 mr-2" />
            Jobs
          </button>

          <button
            type="button"
            onClick={() => handleToggle('part')}
            className={`h-10 px-4 rounded-full border transition-all flex items-center justify-center text-sm font-medium whitespace-nowrap shrink-0 
              ${activeFilters.includes('part')
                ? 'bg-secondary/10 text-secondary border-secondary shadow-sm'
                : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'}`}
          >
            <Package className="w-4 h-4 mr-2" />
            Parts
          </button>
        </div>

        <div className="bg-muted/30 px-3 py-1.5 rounded-lg border border-border/50 flex items-center gap-2 self-end sm:self-auto">
          <div className="bg-background p-1 rounded-full">
            {/* Reusing Activity icon for consistency with health card, or History for logbook context. Using History here as it fits the page. */}
            <History className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-foreground">{filteredEvents.length}</span>
            <span className="text-xs text-muted-foreground font-medium">Records</span>
          </div>
        </div>
      </div>

      <div className="relative space-y-6 before:absolute before:inset-0 before:ml-[1.25rem] before:-translate-x-px md:before:ml-[1.25rem] before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border/0 before:via-border/80 before:to-border/0 py-4">
        {filteredEvents.length === 0 && (
          <div className="text-center py-12 text-muted-foreground relative z-10">
            <p>No events match the selected filters.</p>
          </div>
        )}
        {filteredEvents.map((event) => (
          <div key={event.id} className="relative flex items-start gap-4 group">
            <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-background border border-background shadow-xs shrink-0 transition-transform duration-300 group-hover:scale-110 mt-1">
              {getEventIcon(event.type)}
            </div>

            <Card
              onClick={() => setSelectedEvent(event)}
              className="flex-1 bg-card rounded-2xl text-foreground hover:bg-accent/5 transition-colors border border-border cursor-pointer active:scale-[0.99] shadow-sm group-hover:shadow-md"
            >
              <CardHeader className="p-4 sm:p-5 pb-3 sm:pb-4">
                <div className="flex items-start justify-between gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1.5">
                      <span className={`text-xs font-black uppercase tracking-wider ${getEventTypeColor(event.type)}`}>
                        {getEventTypeLabel(event.type)}
                      </span>
                      {event.status && (event.type === 'part' || event.type === 'modification') && (
                        <span className="text-[10px] bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-full font-medium border border-border/50">
                          {event.status}
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-lg font-bold text-foreground mb-1 leading-tight">
                      {event.title}
                    </CardTitle>
                    {event.description && (
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mt-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end">
                    <span className="text-xs font-medium text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md border border-border/50">
                      {event.date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    {event.odometer && (
                      <span className="text-[10px] font-semibold text-muted-foreground mt-2 flex items-center gap-1 opacity-80">
                        <Gauge className="w-3 h-3" />
                        {event.odometer.toLocaleString()} mi
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              {(event.cost !== undefined && event.cost > 0) && (
                <CardContent className="px-4 sm:px-5 pt-0 pb-4">
                  <div className="flex justify-between items-center border-t border-border/40 pt-3 mt-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Cost</span>
                    <span className="text-sm font-bold text-foreground">
                      ${event.cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
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
