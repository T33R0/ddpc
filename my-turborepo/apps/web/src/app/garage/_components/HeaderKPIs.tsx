'use client';

import React from 'react';
import { Card } from '@repo/ui/card';
import { Badge } from '@repo/ui/badge';
import { useKPIs } from '@/lib/hooks/useKPIs';

interface HeaderKPIsProps {
  vehicleId: string | null;
}

export function HeaderKPIs({ vehicleId }: HeaderKPIsProps) {
  const { data, isLoading, error } = useKPIs(vehicleId);

  // Show loading state when no vehicle is selected yet
  if (!vehicleId) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 bg-gray-900 border-gray-800">
            <div className="h-4 bg-gray-700 rounded mb-2 animate-pulse"></div>
            <div className="h-6 bg-gray-700 rounded animate-pulse"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="col-span-full text-center py-4">
          {error.message === 'Authentication required' ? (
            <div className="text-yellow-400">
              <p>Please sign in to view your garage dashboard. Use the sign in button in the header above.</p>
            </div>
          ) : (
            <div className="text-red-400">
              Failed to load KPIs
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-gray-700 rounded mb-2"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {data.tiles.map((kpi) => (
        <Card key={kpi.key} className="p-4 bg-gray-900 border-gray-800">
          <div className="text-sm text-gray-400 mb-1">{kpi.label}</div>
          <div className="text-2xl font-bold text-white">{kpi.value}</div>
        </Card>
      ))}
    </div>
  );
}
