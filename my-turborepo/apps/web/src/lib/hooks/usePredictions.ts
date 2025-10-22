import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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

  useEffect(() => {
    if (!vehicleId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    const fetchPredictions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          throw new Error('Authentication required');
        }

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
    };

    fetchPredictions();
  }, [vehicleId]);

  return { data, isLoading, error };
}
