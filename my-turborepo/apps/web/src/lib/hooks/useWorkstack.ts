import { useState, useEffect } from 'react';
import type { DashboardWorkItem } from '@repo/types';

export function useWorkstack() {
  const [data, setData] = useState<{ items: DashboardWorkItem[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchWorkstack = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/garage/workstack');
        if (!response.ok) {
          throw new Error('Failed to fetch workstack');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkstack();
  }, []);

  return { data, isLoading, error };
}
