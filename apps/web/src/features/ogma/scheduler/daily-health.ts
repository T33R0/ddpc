import { ogmaSensors } from '../sensors';
import { evaluateAlerts, SystemStats } from './alerts';
import { OgmaAlert } from '../types';

export interface DailyHealthReport {
  status: 'Green' | 'Yellow' | 'Red';
  summary: string;
  alerts: OgmaAlert[];
  stats: SystemStats;
}

export async function runDailyHealthCheck(): Promise<DailyHealthReport> {
  // 1. Gather Data (Sensors)
  // Note: These sensor methods need to be awaited if they are async in implementation.
  // Checking sensor definitions in index.ts -> they point to functions.
  // Assuming they return promises or values. Based on previous context, likely promises.
  
  const spendData = await ogmaSensors.health.getComputeSpend();
  // metrics usually returns { total: number, period: string }
  const spend24h = spendData.total;

  const errorRate = await ogmaSensors.health.getErrorRate();
  // returns number

  const stats: SystemStats = {
    spend24h,
    errorRate24h: errorRate
  };

  // 2. Evaluate Alerts
  const alerts = evaluateAlerts(stats);

  // 3. Determine Status
  let status: 'Green' | 'Yellow' | 'Red' = 'Green';
  const hasCritical = alerts.some(a => a.severity === 'critical');
  const hasWarning = alerts.some(a => a.severity === 'warning');

  if (hasCritical) {
    status = 'Red';
  } else if (hasWarning) {
    status = 'Yellow';
  }

  // 4. Generate Summary
  const summary = `
The State of the Shop is **${status}**.
- **Daily Spend**: $${stats.spend24h.toFixed(2)}
- **Error Rate**: ${stats.errorRate24h.toFixed(1)}%
- **Active Alerts**: ${alerts.length}
  `.trim();

  return {
    status,
    summary,
    alerts,
    stats
  };
}
