// Ogma Sensors - Unified Export
// Central access point for all Ogma sensors

import * as analytics from './analytics';
import * as health from './health';
import * as codebase from './codebase';
import * as business from './business';

/**
 * Unified sensor interface for Ogma
 * 
 * Usage:
 * ```ts
 * import { ogmaSensors } from '@/features/ogma/sensors';
 * 
 * const users = await ogmaSensors.analytics.getActiveUsers();
 * const spend = await ogmaSensors.health.getComputeSpend();
 * ```
 */
export const ogmaSensors = {
  analytics: {
    getOgmaUsage: analytics.getOgmaUsage,
    getActiveUsers: analytics.getActiveUsers,
    getFeatureUsage: analytics.getFeatureUsage,
    getSessionMetrics: analytics.getSessionMetrics,
  },
  health: {
    getErrorRate: health.getErrorRate,
    getComputeSpend: health.getComputeSpend,
    getApiLatency: health.getApiLatency,
    getBuildStatus: health.getBuildStatus,
  },
  codebase: {
    getRepoStructure: codebase.getRepoStructure,
    getRecentCommits: codebase.getRecentCommits,
    getFileContent: codebase.getFileContent,
    getOpenPullRequests: codebase.getOpenPullRequests,
    getOpenIssues: codebase.getOpenIssues,
  },
  business: {
    getSubscriptionStats: business.getSubscriptionStats,
    getRevenueMetrics: business.getRevenueMetrics,
    getTrialConversion: business.getTrialConversion,
  },
};

// Type export for consumers
export type OgmaSensors = typeof ogmaSensors;

// Re-export individual modules
export { analytics, health, codebase, business };
