import { useState, useEffect } from 'react';

export interface Activity {
  occurredAt: string;
  eventType: string;
  title: string;
  odometerMi: number | null;
}

export function useActivity(vehicleId: string | null) {
  const [data, setData] = useState<{ items: Activity[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchActivity = async () => {
    if (!vehicleId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`/api/garage/activity?vehicleId=${encodeURIComponent(vehicleId)}`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error('Failed to fetch activity');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [vehicleId]);

  return { data, isLoading, error, refetch: fetchActivity };
}
