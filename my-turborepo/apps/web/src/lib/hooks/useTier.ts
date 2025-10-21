import { useState, useEffect } from 'react';
import { getPlanForUser } from '../plan-utils';
import { useAuth } from '@/lib/auth';
import type { Tier } from '@repo/types';

export function useTier() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<Tier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTier = async () => {
      // Wait for auth to load
      if (authLoading) {
        return;
      }

      if (!user?.id) {
        setData('T0'); // Default to T0 for unauthenticated users
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const tier = await getPlanForUser(user.id);
        setData(tier);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setData('T0'); // Fallback to T0
      } finally {
        setIsLoading(false);
      }
    };

    fetchTier();
  }, [user?.id, authLoading]);

  return { data, isLoading: isLoading || authLoading, error };
}
