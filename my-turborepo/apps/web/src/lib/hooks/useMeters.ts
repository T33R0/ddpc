import { useState, useEffect } from 'react';
import type { UsageStats } from '@repo/types';

export function useMeters() {
  const [data, setData] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMeters = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/usage');
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication required');
          }
          throw new Error('Failed to fetch usage meters');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeters();
  }, []);

  return { data, isLoading, error };
}
