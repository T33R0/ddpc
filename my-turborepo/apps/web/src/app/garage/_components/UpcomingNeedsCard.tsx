'use client';

import React, { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { Badge } from '@repo/ui/badge';
import { usePredictions } from '@/lib/hooks/usePredictions';
import { useTier } from '@/lib/hooks/useTier';
import { useTelemetry } from '@/lib/hooks/useTelemetry';
import { useAuth } from '@/lib/auth';

interface UpcomingNeedsCardProps {
  vehicleId: string | null;
}

export function UpcomingNeedsCard({ vehicleId }: UpcomingNeedsCardProps) {
  const { data: predictions, isLoading, error } = usePredictions(vehicleId);
  const { data: tier } = useTier();
  const { track } = useTelemetry();
  const { user } = useAuth();

  useEffect(() => {
    if (predictions && predictions.length > 0) {
      track('prediction.view', {
        vehicleId,
        predictionCount: predictions.length,
        tier
      });
    } else if (predictions && predictions.length === 0 && !isLoading && !error) {
      // Track when nudge is shown
      track('prediction.nudge_shown', {
        vehicleId,
        tier
      });
    }
  }, [predictions, vehicleId, tier, track, isLoading, error]);

  const handlePredictionClick = (prediction: any) => {
    track('prediction.click', {
      vehicleId,
      category: prediction.category,
      risk: prediction.risk,
      tier
    });
  };

  const handlePredictionDismiss = (prediction: any) => {
    track('prediction.dismiss', {
      vehicleId,
      category: prediction.category,
      risk: prediction.risk,
      tier
    });
  };

  if (!user || !vehicleId) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Upcoming Needs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !predictions || predictions.length === 0) {
    // Show nudge when no predictions are available
    return (
      <div className="text-center py-6 px-4 bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg border border-gray-700">
        <div className="text-gray-400 text-sm">
          Log your first install and odometer to unlock predictions.
        </div>
      </div>
    );
  }

  const getRiskColor = (risk: number) => {
    if (risk >= 0.7) return 'bg-red-500';
    if (risk >= 0.4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getRiskLabel = (risk: number) => {
    if (risk >= 0.7) return 'High Risk';
    if (risk >= 0.4) return 'Medium Risk';
    return 'Low Risk';
  };

  const getCTAText = (tier: string | null) => {
    switch (tier) {
      case 'T0':
        return 'Learn More';
      case 'T1':
        return 'Schedule Service';
      case 'T2':
        return 'Plan Maintenance';
      case 'T3':
        return 'Optimize Performance';
      default:
        return 'Get Started';
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Upcoming Needs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {predictions.slice(0, 3).map((prediction, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white font-medium">{prediction.category}</span>
                <Badge
                  className={`text-xs ${getRiskColor(prediction.risk)} text-white`}
                >
                  {getRiskLabel(prediction.risk)}
                </Badge>
              </div>
              <p className="text-gray-400 text-sm">{prediction.reason}</p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <span className="text-yellow-400 font-bold">
                {(prediction.risk * 100).toFixed(0)}%
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePredictionClick(prediction)}
                className="text-xs"
              >
                {getCTAText(tier)}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handlePredictionDismiss(prediction)}
                className="text-gray-400 hover:text-white text-xs"
              >
                ✕
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
