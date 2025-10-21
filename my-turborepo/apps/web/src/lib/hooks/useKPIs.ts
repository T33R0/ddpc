import { useState, useEffect } from 'react';
import type { KPI } from '@repo/types';

export function useKPIs() {
  const [data, setData] = useState<{ tiles: KPI[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/garage/kpis');
        if (!response.ok) {
          throw new Error('Failed to fetch KPIs');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchKPIs();
  }, []);

  return { data, isLoading, error };
}
