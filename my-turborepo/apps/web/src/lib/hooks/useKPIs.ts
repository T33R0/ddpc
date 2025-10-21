import { useState, useEffect } from 'react';
import type { KPI } from '@repo/types';
import { supabase } from '@/lib/supabase';

export function useKPIs() {
  const [data, setData] = useState<{ tiles: KPI[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        setIsLoading(true);

        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          throw new Error('Authentication required');
        }

        const response = await fetch('/api/garage/kpis', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

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

    fetchKPIs();
  }, []);

  return { data, isLoading, error };
}
