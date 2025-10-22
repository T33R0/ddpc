import { useState, useEffect } from 'react';

export interface KPI {
  key: string;
  label: string;
  value: string;
}

export function useKPIs(vehicleId: string | null) {
  const [data, setData] = useState<{ tiles: KPI[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchKPIs = async () => {
    if (!vehicleId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`/api/garage/kpis?vehicleId=${encodeURIComponent(vehicleId)}`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
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

  useEffect(() => {
    fetchKPIs();
  }, [vehicleId]);

  return { data, isLoading, error, refetch: fetchKPIs };
}
