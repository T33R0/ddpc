import type { User } from '@repo/types';

// Tier mapping from existing plan system
export type Tier = 'T0' | 'T1' | 'T2' | 'T3';

export function mapPlanToTier(plan: User['plan']): Tier {
  switch (plan) {
    case 'free': return 'T0';
    case 'builder': return 'T1'; // Mapping builder to T1 for now
    case 'pro': return 'T3'; // Mapping pro to T3 for now
    default: return 'T0';
  }
}

export function getPlanForUser(userId: string): Promise<Tier> {
  // This would typically fetch from database
  // For now, return T0 as default
  return Promise.resolve('T0');
}

export function requireFeature(tier: Tier, featureKey: string): boolean {
  const features: Record<Tier, string[]> = {
    T0: ['basic_garage', 'vehicle_management'],
    T1: ['basic_garage', 'vehicle_management', 'maintenance_scheduling', 'limited_ai'],
    T2: ['basic_garage', 'vehicle_management', 'maintenance_scheduling', 'full_ai', 'build_planning'],
    T3: ['basic_garage', 'vehicle_management', 'maintenance_scheduling', 'full_ai', 'build_planning', 'automation']
  };

  return features[tier].includes(featureKey);
}

export function checkLimit(tier: Tier, limitKey: string, currentValue: number): boolean {
  const limits: Record<Tier, Record<string, number>> = {
    T0: {
      vehicles: 2,
      storageGB: 0.05, // 50MB
      photosPerVehicle: 1,
      aiTokensPerMonth: 0,
      aiRequestsPerMinute: 0
    },
    T1: {
      vehicles: 3,
      storageGB: 1,
      photosPerVehicle: 10,
      aiTokensPerMonth: 100000,
      aiRequestsPerMinute: 1
    },
    T2: {
      vehicles: 10,
      storageGB: 10,
      photosPerVehicle: Infinity,
      aiTokensPerMonth: 400000,
      aiRequestsPerMinute: 3
    },
    T3: {
      vehicles: 100,
      storageGB: 100,
      photosPerVehicle: Infinity,
      aiTokensPerMonth: 1500000,
      aiRequestsPerMinute: 10
    }
  };

  const limit = limits[tier][limitKey];
  if (limit === undefined) return true; // No limit defined
  return currentValue < limit;
}

export async function decrementAiBudget(userId: string, tokens: number): Promise<boolean> {
  // Implementation would check and decrement user's AI token budget
  // For now, always return true
  return true;
}

export async function rateLimit(userId: string, scope: string, perMinute: number): Promise<boolean> {
  // Implementation would check rate limits
  // For now, always return true
  return true;
}

// Intent validation for AI features
export const ALLOWED_INTENTS: Record<Tier, string[]> = {
  T0: [],
  T1: ['maintenance_advice', 'parts_crossref', 'vehicle_suggestions'],
  T2: ['maintenance_advice', 'parts_crossref', 'vehicle_suggestions', 'performance_advice', 'compatibility'],
  T3: ['maintenance_advice', 'parts_crossref', 'vehicle_suggestions', 'performance_advice', 'compatibility', 'ops_bulk']
};

export function validateIntent(tier: Tier, intent: string): boolean {
  return ALLOWED_INTENTS[tier].includes(intent);
}

// Error response for upgrade requirements
export interface UpgradeRequiredError {
  code: 'UPGRADE_REQUIRED';
  targetTier: Tier;
  message: string;
}
