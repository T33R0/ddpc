import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { UpcomingService } from '../lib/getVehicleServiceData'
import { format, formatDistanceToNow } from 'date-fns'
import { Clock, AlertTriangle, Calendar, MapPin, CheckCircle } from 'lucide-react'

interface UpcomingServicesProps {
  upcomingServices: UpcomingService[]
}

export function UpcomingServices({ upcomingServices }: UpcomingServicesProps) {
  if (upcomingServices.length === 0) {
    return (
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <CheckCircle className="h-12 w-12 text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">No Upcoming Services</h3>
          <p className="text-sm text-gray-500 text-center max-w-md">
            Once you add service intervals and maintenance records, upcoming services will be calculated and displayed here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Clock className="h-5 w-5" />
          Upcoming & Planned Services
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingServices.map((service) => (
          <div
            key={service.id}
            className={`rounded-lg p-4 border transition-colors ${
              service.is_overdue
                ? 'bg-red-900/20 border-red-700 hover:border-red-600'
                : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-lg font-medium text-white">
                    {service.name}
                  </h4>
                  {service.is_overdue && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Overdue
                    </Badge>
                  )}
                </div>

                {service.description && (
                  <p className="text-sm text-gray-400 mb-2">
                    {service.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  {service.interval_months && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Every {service.interval_months} months
                    </div>
                  )}
                  {service.interval_miles && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      Every {service.interval_miles.toLocaleString()} miles
                    </div>
                  )}
                </div>

                {service.last_service_date && (
                  <div className="text-xs text-gray-500 mt-1">
                    Last service: {format(service.last_service_date, 'MMM dd, yyyy')}
                    {service.last_service_odometer && ` at ${service.last_service_odometer.toLocaleString()} miles`}
                  </div>
                )}
              </div>

              <div className="text-right">
                {service.next_due_date && (
                  <div className={`text-sm font-medium ${service.is_overdue ? 'text-red-400' : 'text-yellow-400'}`}>
                    {service.is_overdue ? 'Overdue' : 'Due'} {formatDistanceToNow(service.next_due_date, { addSuffix: true })}
                  </div>
                )}
                {service.next_due_miles && (
                  <div className={`text-sm font-medium ${service.is_overdue ? 'text-red-400' : 'text-yellow-400'}`}>
                    At {service.next_due_miles.toLocaleString()} miles
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

