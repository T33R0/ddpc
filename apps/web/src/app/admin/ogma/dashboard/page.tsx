
import { OgmaChatWindow } from '@/features/ogma/components/OgmaChatWindow';
import { MetricsCards } from '@/features/ogma/components/MetricsCards';
import { AlertFeed } from '@/features/ogma/components/AlertFeed';
import { ReportViewer } from '@/features/ogma/components/ReportViewer';
import { ogmaSensors } from '@/features/ogma/sensors';
import { evaluateAlerts, SystemStats } from '@/features/ogma/scheduler/alerts';
// import { Button } from '@repo/ui/button';
import { Settings } from 'lucide-react';
import { Button } from '@repo/ui/button';

// Mock data for reports since we don't have persistence yet
const MOCK_REPORTS = [
  { id: '1', date: new Date().toISOString(), status: 'Green' as const, summary: 'All systems nominal.' },
  { id: '2', date: new Date(Date.now() - 86400000).toISOString(), status: 'Green' as const, summary: 'Minor latency spike resolved.' },
  { id: '3', date: new Date(Date.now() - 172800000).toISOString(), status: 'Yellow' as const, summary: 'Higher than average spend detected.' },
];

export const dynamic = 'force-dynamic';

export default async function OgmaDashboardPage() {
  // 1. Fetch Real Data
  const spendData = await ogmaSensors.health.getComputeSpend();
  const errorRate = await ogmaSensors.health.getErrorRate();
  const activeUsers = await ogmaSensors.analytics.getActiveUsers(); // Note: check return type, might need waiting

  const stats: SystemStats = {
    spend24h: spendData.total,
    errorRate24h: errorRate,
  };

  // 2. Generate Alerts Live
  const alerts = evaluateAlerts(stats);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ogma Dashboard</h2>
          <p className="text-muted-foreground">Shop Foreman Command Center</p>
        </div>
        <div className="flex items-center space-x-2">
            {/* Placeholder for settings */}
           <Button variant="outline" size="icon">
             <Settings className="h-4 w-4" />
           </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <MetricsCards stats={stats} activeUsers={activeUsers.count} />

      {/* Main Content Grid */}
      <div className="grid flex-1 gap-4 md:grid-cols-12 lg:grid-cols-12 min-h-0">
        
        {/* Left Column (Feed & Reports) */}
        <div className="flex flex-col gap-4 md:col-span-7 lg:col-span-7 overflow-y-auto">
          <AlertFeed alerts={alerts} />
          <ReportViewer reports={MOCK_REPORTS} />
        </div>

        {/* Right Column (Chat) */}
        <div className="flex flex-col md:col-span-5 lg:col-span-5 h-full min-h-[500px]">
          <div className="h-full rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
             {/* We need to ensure OgmaChatWindow fits well here. 
                 It likely handles its own height, but we wrap it to be safe. 
             */}
             <OgmaChatWindow 
                className="h-full border-0 shadow-none" 
                initialContext="You are acting as the Shop Foreman in the Dashboard context. The user is looking at system stats."
             />
          </div>
        </div>

      </div>
    </div>
  );
}
