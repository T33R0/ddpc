'use client';

import React from 'react';
import { Card } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { Badge } from '@repo/ui/badge';
import { useTier } from '@/lib/hooks/useTier';
import { useMeters } from '@/lib/hooks/useMeters';

export function UpgradeHooks() {
  const { data: tier } = useTier();
  const { data: usage } = useMeters();

  if (!tier || !usage) return null;

  // Calculate if any meters are over 80%
  const vehicleLimit = tier === 'T0' ? 2 : tier === 'T1' ? 3 : 10;
  const storageLimit = tier === 'T0' ? 0.05 : tier === 'T1' ? 1 : 10;
  const aiLimit = tier === 'T0' ? 0 : tier === 'T1' ? 100000 : 400000;

  const vehiclePercent = (usage.vehiclesUsed / vehicleLimit) * 100;
  const storagePercent = (usage.storageUsedGB / storageLimit) * 100;
  const aiPercent = aiLimit > 0 ? (usage.aiTokensUsed / aiLimit) * 100 : 0;

  const needsUpgrade = vehiclePercent > 80 || storagePercent > 80 || aiPercent > 80;

  if (!needsUpgrade) {
    return (
      <Card className="p-6 bg-gray-900 border-gray-800">
        <h2 className="text-xl font-semibold text-white mb-4">Plan Status</h2>
        <div className="text-center py-4">
          <Badge className="bg-green-600 text-white mb-2">
            {tier} Plan Active
          </Badge>
          <div className="text-sm text-gray-400">
            All systems running smoothly
          </div>
        </div>
      </Card>
    );
  }

  const getUpgradeMessage = () => {
    if (tier === 'T0') {
      return {
        title: 'Ready to level up?',
        message: 'Unlock maintenance scheduling, AI assistance, and more storage.',
        targetTier: 'T1',
        features: ['Maintenance schedules', 'AI assistant', '1GB storage', '3 vehicles']
      };
    } else if (tier === 'T1') {
      return {
        title: 'Build like a pro',
        message: 'Design custom builds, get performance insights, and expand your limits.',
        targetTier: 'T2',
        features: ['Build planning', 'Performance AI', '10GB storage', '10 vehicles']
      };
    } else {
      return {
        title: 'Go enterprise',
        message: 'Automate workflows, integrate APIs, and manage fleets at scale.',
        targetTier: 'T3',
        features: ['API automation', 'Webhooks', '100GB storage', '100 vehicles']
      };
    }
  };

  const upgradeInfo = getUpgradeMessage();

  return (
    <Card className="p-6 bg-gradient-to-br from-lime-500/10 to-purple-500/10 border-lime-500/20">
      <h2 className="text-xl font-semibold text-white mb-4">{upgradeInfo.title}</h2>

      <div className="space-y-4">
        <p className="text-gray-300">{upgradeInfo.message}</p>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-white">Includes:</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            {upgradeInfo.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="text-lime-400">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <Button className="w-full bg-lime-500 text-black hover:bg-lime-400 font-semibold">
          Upgrade to {upgradeInfo.targetTier}
        </Button>

        <div className="text-xs text-gray-500 text-center">
          Cancel anytime • Instant activation
        </div>
      </div>
    </Card>
  );
}
