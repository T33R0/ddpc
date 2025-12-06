import { useState, useEffect, useCallback, useRef } from 'react';

export interface Vehicle {
  id: string;
  name: string;
  nickname?: string;
  ymmt: string;
  odometer: number | null;
  current_status: string;
  image_url?: string;
  created_at?: string;
  last_event_at?: string | null;
  updated_at?: string | null;
}

export interface VehiclesData {
  vehicles: Vehicle[];
  preferredVehicleId?: string;
}

export function useVehicles(options: { enabled?: boolean } = {}) {
  const [data, setData] = useState<VehiclesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { enabled = true } = options;

  const fetchVehicles = useCallback(async () => {
    if (!enabled) return;

    try {
      setIsLoading(true);

      const response = await fetch('/api/garage/vehicles', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error('Failed to fetch vehicles');
      }

      const result: VehiclesData = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      fetchVehicles();
    }
  }, [enabled, fetchVehicles]);

  return { data, isLoading, error, refetch: fetchVehicles };
}

export interface StoredVehiclesData {
  vehicles: Vehicle[];
  hasMore: boolean;
  page: number;
  limit: number;
}

interface UseStoredVehiclesOptions {
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

export function useStoredVehicles(options: UseStoredVehiclesOptions = {}) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  // Keep track of options to detect changes
  const prevOptionsRef = useRef(options);

  const { sort_by, sort_direction } = options;

  const fetchStoredVehicles = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setIsLoading(true);
        // Do not clear vehicles immediately to prevent flash, unless strictly needed?
        // Actually, for sorting change we MUST clear.
        if (page === 1) {
             setVehicles([]);
             setCurrentPage(0);
        }
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '24',
        stored_only: 'true'
      });

      if (sort_by) params.set('sort_by', sort_by);
      if (sort_direction) params.set('sort_direction', sort_direction);

      const response = await fetch(`/api/garage/vehicles?${params.toString()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error('Failed to fetch stored vehicles');
      }

      const result: StoredVehiclesData = await response.json();

      if (append) {
        setVehicles(prev => [...prev, ...result.vehicles]);
      } else {
        setVehicles(result.vehicles);
      }

      setHasMore(result.hasMore);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  }, [sort_by, sort_direction]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchStoredVehicles(currentPage + 1, true);
    }
  }, [loadingMore, hasMore, currentPage, fetchStoredVehicles]);

  // Refetch when sort options change
  useEffect(() => {
    const prevOptions = prevOptionsRef.current;
    if (prevOptions.sort_by !== sort_by || prevOptions.sort_direction !== sort_direction) {
        prevOptionsRef.current = { sort_by, sort_direction };
        fetchStoredVehicles(1, false);
    }
  }, [sort_by, sort_direction, fetchStoredVehicles]);

  // Initial fetch
  useEffect(() => {
    // Only fetch if empty (initial load) or explicit trigger
    // Actually, the dependency array above handles sort changes.
    // We just need to ensure we fetch once on mount if no sort change triggered it immediately.
    // The previous useEffect handles changes, but we need one for mount?
    // Let's rely on a separate effect for mount only if we want to be safe,
    // or just assume the options change effect will run (it might not if props are stable on first render).

    // To be safe, we check if we haven't loaded yet.
    if (currentPage === 0 && !isLoading && !loadingMore && vehicles.length === 0) {
        fetchStoredVehicles(1, false);
    }
  }, [fetchStoredVehicles, currentPage, isLoading, loadingMore, vehicles.length]);

  const refetch = useCallback(() => {
    fetchStoredVehicles(1, false);
  }, [fetchStoredVehicles]);

  return {
    vehicles,
    isLoading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refetch
  };
}
