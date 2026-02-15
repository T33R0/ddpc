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
      <Card 
        className="bg-card backdrop-blur-lg rounded-2xl text-foreground border border-border"
      >
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No Service History</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Service records will appear here once maintenance work has been logged for this vehicle.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card 
      className="bg-card backdrop-blur-lg rounded-2xl text-foreground border border-border"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Wrench className="h-5 w-5" />
          Service History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {serviceHistory.map((service) => (
          <div
            key={service.id}
            className="bg-muted/50 backdrop-blur-sm rounded-lg p-4 border border-border hover:border-accent transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="text-lg font-medium text-foreground mb-1">
                  {service.description}
                </h4>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                <div className="flex items-center gap-1 text-success font-medium">
                  <DollarSign className="h-4 w-4" />
                  ${service.cost.toLocaleString()}
                </div>
              )}
            </div>

            {service.notes && (
              <div className="flex items-start gap-2 mt-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">
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







