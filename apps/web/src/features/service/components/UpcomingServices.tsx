import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { UpcomingService } from '../lib/getVehicleServiceData'
import { Wrench, MapPin, CheckCircle } from 'lucide-react'

interface UpcomingServicesProps {
  upcomingServices: UpcomingService[]
  onLogService: (service: UpcomingService) => void;
}

export function UpcomingServices({ upcomingServices, onLogService }: UpcomingServicesProps) {
  if (upcomingServices.length === 0) {
    return (
      <Card
        className="bg-card backdrop-blur-lg rounded-2xl text-foreground border border-border"
      >
        <CardContent className="flex flex-col items-center justify-center py-16">
          <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No Service Plan Items</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Service intervals from your vehicle&apos;s maintenance plan will be displayed here.
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
          Service Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingServices.map((service) => (
          <div
            key={service.id}
            className="rounded-lg p-4 border bg-muted/50 backdrop-blur-sm border-border hover:border-accent transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-lg font-medium text-foreground">{service.name}</h4>
                  {service.due_status === 'overdue' && (
                    <Badge variant="destructive">Overdue</Badge>
                  )}
                  {service.due_status === 'due' && (
                    <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                      Due Soon
                    </Badge>
                  )}
                  {service.due_status === 'ok' && (
                    <Badge variant="secondary">OK</Badge>
                  )}
                  {!service.due_status && (
                    <Badge variant="outline" className="text-yellow-400 border-yellow-400/50">
                      Due
                    </Badge>
                  )}
                </div>

                {service.due_message && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {service.due_message}
                  </p>
                )}

                {service.interval_miles && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>Every {service.interval_miles.toLocaleString()} miles</span>
                  </div>
                )}
              </div>

              <Button
                onClick={() => onLogService(service)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0"
              >
                Log Service
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
