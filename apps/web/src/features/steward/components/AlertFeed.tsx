import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Badge } from '@repo/ui/badge';
import { StewardAlert } from '../types';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';

interface AlertFeedProps {
  alerts: StewardAlert[];
}

export function AlertFeed({ alerts }: AlertFeedProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Active Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active alerts.</p>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start space-x-4 rounded-md border p-4 transition-all hover:bg-accent/50"
              >
                <div className="mt-0.5">
                  {alert.severity === 'critical' ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  ) : alert.severity === 'warning' ? (
                    <AlertTriangle className="h-5 w-5 text-warning" />
                  ) : (
                    <Info className="h-5 w-5 text-info" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium leading-none">
                      {alert.title}
                    </p>
                    <Badge
                      variant={
                        alert.severity === 'critical'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {alert.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Source: {alert.source} • {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
