'use client';

import React from 'react';
import { Card } from '@repo/ui/card';
import { Badge } from '@repo/ui/badge';
import { useActivity } from '@/lib/hooks/useActivity';

export function RecentActivity() {
  const { data, isLoading, error } = useActivity();

  if (error) {
    return (
      <Card className="p-6 bg-gray-900 border-gray-800">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
        <div className="text-center text-red-400 py-4">
          Failed to load activity
        </div>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <Card className="p-6 bg-gray-900 border-gray-800">
        <div className="h-6 bg-gray-700 rounded mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-800 rounded animate-pulse"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gray-900 border-gray-800">
      <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>

      {data.activities.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400">No recent activity</div>
        </div>
      ) : (
        <div className="space-y-3">
          {data.activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-white text-sm">{activity.title}</h3>
                  <Badge variant="outline" className="text-xs border-gray-600">
                    {activity.type.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-gray-400">{activity.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(activity.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
