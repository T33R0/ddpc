import { StewardAlert } from '../types';

export interface SystemStats {
  spend24h: number;
  errorRate24h: number;
}

export function evaluateAlerts(stats: SystemStats): StewardAlert[] {
  const alerts: StewardAlert[] = [];

  // Spend Thresholds
  if (stats.spend24h > 5.00) {
    alerts.push({
      id: crypto.randomUUID(),
      severity: 'critical',
      title: 'Critical Spend Alert',
      message: `Daily compute spend exceeded critical threshold ($${stats.spend24h.toFixed(2)})`,
      source: 'scheduler',
      timestamp: new Date(),
      acknowledged: false
    });
  } else if (stats.spend24h > 1.00) {
    alerts.push({
      id: crypto.randomUUID(),
      severity: 'warning',
      title: 'High Spend Warning',
      message: `Daily compute spend is rising ($${stats.spend24h.toFixed(2)})`,
      source: 'scheduler',
      timestamp: new Date(),
      acknowledged: false
    });
  }

  // Error Rate Thresholds
  if (stats.errorRate24h > 5) {
    alerts.push({
      id: crypto.randomUUID(),
      severity: 'critical',
      title: 'High Error Rate',
      message: `High error rate detected (${stats.errorRate24h.toFixed(1)}%)`,
      source: 'scheduler',
      timestamp: new Date(),
      acknowledged: false
    });
  } else if (stats.errorRate24h > 1) {
    alerts.push({
      id: crypto.randomUUID(),
      severity: 'warning',
      title: 'Elevated Error Rate',
      message: `Elevated error rate detected (${stats.errorRate24h.toFixed(1)}%)`,
      source: 'scheduler',
      timestamp: new Date(),
      acknowledged: false
    });
  }

  return alerts;
}
