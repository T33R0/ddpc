'use client';

import React from 'react';
import { Card } from '@repo/ui/card';
import { Badge } from '@repo/ui/badge';
import { useMeters } from '@/lib/hooks/useMeters';
import { useTier } from '@/lib/hooks/useTier';

// Simple progress bar component
function ProgressBar({ value, className = '', indicatorClassName = '' }: {
  value: number;
  className?: string;
  indicatorClassName?: string;
}) {
  return (
    <div className={`w-full bg-gray-700 rounded-full h-2 ${className}`}>
      <div
        className={`h-2 rounded-full transition-all duration-300 ${indicatorClassName}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Meters() {
  const { data, isLoading, error } = useMeters();
  const { data: tier } = useTier();

  if (error) {
    return (
      <Card className="p-6 bg-gray-900 border-gray-800">
        <h2 className="text-xl font-semibold text-white mb-4">Usage Meters</h2>
        <div className="text-center py-4">
          {error.message === 'Authentication required' ? (
            <div className="text-yellow-400">
              <p>Please sign in to view your usage. Use the sign in button in the header above.</p>
            </div>
          ) : (
            <div className="text-red-400">
              Failed to load usage data
            </div>
          )}
        </div>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <Card className="p-6 bg-gray-900 border-gray-800">
        <div className="h-6 bg-gray-700 rounded mb-4 animate-pulse"></div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-800 rounded animate-pulse"></div>
          ))}
        </div>
      </Card>
    );
  }

  // Calculate percentages (mock limits for now)
  const vehicleLimit = tier === 'T0' ? 2 : tier === 'T1' ? 3 : 10;
  const storageLimit = tier === 'T0' ? 0.05 : tier === 'T1' ? 1 : 10; // GB
  const aiLimit = tier === 'T0' ? 0 : tier === 'T1' ? 100000 : 400000; // tokens

  const vehiclePercent = (data.vehiclesUsed / vehicleLimit) * 100;
  const storagePercent = (data.storageUsedGB / storageLimit) * 100;
  const aiPercent = aiLimit > 0 ? (data.aiTokensUsed / aiLimit) * 100 : 0;

  return (
    <Card className="p-6 bg-gray-900 border-gray-800">
      <h2 className="text-xl font-semibold text-white mb-4">Usage Meters</h2>

      <div className="space-y-6">
        {/* Vehicles Meter */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Vehicles</span>
            <span className="text-sm text-white">{data.vehiclesUsed}/{vehicleLimit}</span>
          </div>
          <ProgressBar
            value={vehiclePercent}
            indicatorClassName={vehiclePercent > 80 ? 'bg-red-500' : 'bg-lime-500'}
          />
          {vehiclePercent > 80 && (
            <Badge variant="destructive" className="mt-2 text-xs">
              Upgrade needed
            </Badge>
          )}
        </div>

        {/* Storage Meter */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Storage</span>
            <span className="text-sm text-white">{data.storageUsedGB.toFixed(2)}GB/{storageLimit}GB</span>
          </div>
          <ProgressBar
            value={storagePercent}
            indicatorClassName={storagePercent > 80 ? 'bg-red-500' : 'bg-blue-500'}
          />
          {storagePercent > 80 && (
            <Badge variant="destructive" className="mt-2 text-xs">
              Upgrade needed
            </Badge>
          )}
        </div>

        {/* AI Tokens Meter (T1+) */}
        {tier !== 'T0' && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">AI Tokens</span>
              <span className="text-sm text-white">{data.aiTokensUsed.toLocaleString()}/{aiLimit.toLocaleString()}</span>
            </div>
            <ProgressBar
              value={aiPercent}
              indicatorClassName={aiPercent > 80 ? 'bg-red-500' : 'bg-purple-500'}
            />
            {aiPercent > 80 && (
              <Badge variant="destructive" className="mt-2 text-xs">
                Upgrade needed
              </Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
