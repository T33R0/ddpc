import { useState, useEffect, useCallback } from 'react';

export interface Prediction {
  category: string;
  risk: number;
  reason: string;
  cohortSize: number;
}

export function usePredictions(vehicleId: string | null) {
  const [data, setData] = useState<Prediction[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPredictions = useCallback(async () => {
    if (!vehicleId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/garage/predictions?vehicleId=${encodeURIComponent(vehicleId)}`
      );

      if (response.status === 204) {
        // No predictions available (user needs to log installs/odometer)
        setData([]);
      } else if (!response.ok) {
        throw new Error('Failed to fetch predictions');
      } else {
        const result = await response.json();
        setData(result.predictions || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  return { data, isLoading, error, refetch: fetchPredictions };
}
