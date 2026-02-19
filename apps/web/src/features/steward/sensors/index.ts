// Steward Sensors - Unified Export
// Central access point for all Steward sensors

import * as analytics from './analytics';
import * as health from './health';
import * as codebase from './codebase';
import * as business from './business';

/**
 * Unified sensor interface for Steward
 * 
 * Usage:
 * ```ts
 * import { stewardSensors } from '@/features/steward/sensors';
 * 
 * const users = await stewardSensors.analytics.getActiveUsers();
 * const spend = await stewardSensors.health.getComputeSpend();
 * ```
 */
export const stewardSensors = {
  analytics: {
    getStewardUsage: analytics.getStewardUsage,
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
export type StewardSensors = typeof stewardSensors;

// Re-export individual modules
export { analytics, health, codebase, business };
