import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { ServiceHistoryItem } from '../lib/getVehicleServiceData'
import { format } from 'date-fns'
import { Wrench, DollarSign, MapPin, Calendar, FileText, Building } from 'lucide-react'

interface ServiceHistoryTableProps {
  serviceHistory: ServiceHistoryItem[]
}

export function ServiceHistoryTable({ serviceHistory }: ServiceHistoryTableProps) {
  if (serviceHistory.length === 0) {
    return (
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Wrench className="h-12 w-12 text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">No Service History</h3>
          <p className="text-sm text-gray-500 text-center max-w-md">
            Service records will appear here once maintenance work has been logged for this vehicle.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Wrench className="h-5 w-5" />
          Service History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {serviceHistory.map((service) => (
          <div
            key={service.id}
            className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="text-lg font-medium text-white mb-1">
                  {service.description}
                </h4>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(service.event_date, 'MMM dd, yyyy')}
                  </div>
                  {service.odometer && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {service.odometer.toLocaleString()} miles
                    </div>
                  )}
                  {service.service_provider && (
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {service.service_provider}
                    </div>
                  )}
                </div>
              </div>
              {service.cost && (
                <div className="flex items-center gap-1 text-green-400 font-medium">
                  <DollarSign className="h-4 w-4" />
                  ${service.cost.toLocaleString()}
                </div>
              )}
            </div>

            {service.notes && (
              <div className="flex items-start gap-2 mt-3">
                <FileText className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-300 leading-relaxed">
                  {service.notes}
                </p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}







