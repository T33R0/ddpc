import { useState, useEffect } from 'react';
import type { ActivityItem } from '@repo/types';

export function useActivity() {
  const [data, setData] = useState<{ activities: ActivityItem[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/garage/activity');
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

    fetchActivity();
  }, []);

  return { data, isLoading, error };
}
