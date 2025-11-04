import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { VehicleEvent } from '../lib/getVehicleEvents'

// Icon components for different event types
function MaintenanceIcon() {
  return (
    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
      <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </div>
  )
}

function ModificationIcon() {
  return (
    <div className="w-8 h-8 bg-lime-500/20 rounded-full flex items-center justify-center">
      <svg className="w-4 h-4 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
      </svg>
    </div>
  )
}

function MileageIcon() {
  return (
    <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
      <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
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
    default:
      return 'text-gray-400'
  }
}

interface TimelineFeedProps {
  events: VehicleEvent[]
}

export function TimelineFeed({ events }: TimelineFeedProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No History Yet</h3>
        <p className="text-gray-400">
          Vehicle history will appear here once you add maintenance records, modifications, or mileage updates.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <Card key={event.id} className="bg-gray-900/50 border-gray-700 hover:bg-gray-800/50 transition-colors">
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
                      <span className="text-xs bg-gray-700 text-white px-2 py-1 rounded-full">
                        {event.status}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-lg font-bold text-white mb-1">
                    {event.title}
                  </CardTitle>
                  {event.description && (
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm text-gray-300 font-medium">
                  {event.date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
                {event.odometer && (
                  <p className="text-xs text-gray-500 mt-1">
                    {event.odometer.toLocaleString()} miles
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          {(event.cost !== undefined && event.cost > 0) && (
            <CardContent className="pt-0">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Cost:</span>
                <span className="text-sm font-semibold text-white">
                  ${event.cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {/* TODO: Add pagination for large histories */}
      {/* TODO: Add filtering by event type */}
      {/* TODO: Add sorting options (date, cost, mileage) */}
      {/* TODO: Add search functionality */}
    </div>
  )
}
