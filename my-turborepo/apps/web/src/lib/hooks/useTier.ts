import { useState, useEffect } from 'react';
import { getPlanForUser } from '@repo/services/planUtils';
import { useAuth } from '@/lib/auth';
import type { Tier } from '@repo/types';

export function useTier() {
  const { user } = useAuth();
  const [data, setData] = useState<Tier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTier = async () => {
      if (!user?.id) {
        setData(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const tier = await getPlanForUser(user.id);
        setData(tier);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTier();
  }, [user?.id]);

  return { data, isLoading, error };
}
