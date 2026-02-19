import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Activity, CircleDollarSign, AlertTriangle, Users } from 'lucide-react';
import { SystemStats } from '../scheduler/alerts';

interface MetricsCardsProps {
  stats: SystemStats;
  activeUsers?: number;
}

export function MetricsCards({ stats, activeUsers = 0 }: MetricsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Health</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.errorRate24h < 1 ? 'Good' : stats.errorRate24h < 5 ? 'Fair' : 'Critical'}
          </div>
          <p className="text-xs text-muted-foreground">
            Error rate: {stats.errorRate24h.toFixed(1)}%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Daily Spend</CardTitle>
          <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.spend24h.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            +20.1% from yesterday
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeUsers}</div>
          <p className="text-xs text-muted-foreground">
            +180 since last hour
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Issues</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">3</div>
          <p className="text-xs text-muted-foreground">
            2 high priority
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
