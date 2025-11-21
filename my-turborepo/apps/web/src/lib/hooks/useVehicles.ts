import { useState, useEffect } from 'react';

export interface Vehicle {
  id: string;
  name: string;
  nickname?: string;
  ymmt: string;
  odometer: number | null;
  current_status: string;
  image_url?: string;
}

export interface VehiclesData {
  vehicles: Vehicle[];
  preferredVehicleId?: string;
}

export function useVehicles() {
  const [data, setData] = useState<VehiclesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchVehicles = async () => {
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
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  return { data, isLoading, error, refetch: fetchVehicles };
}

export interface StoredVehiclesData {
  vehicles: Vehicle[];
  hasMore: boolean;
  page: number;
  limit: number;
}

export function useStoredVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  const fetchStoredVehicles = async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setIsLoading(true);
        setVehicles([]);
        setCurrentPage(0);
      }

      const response = await fetch(`/api/garage/vehicles?page=${page}&limit=24&stored_only=true`, {
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
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchStoredVehicles(currentPage + 1, true);
    }
  };

  useEffect(() => {
    fetchStoredVehicles(1, false);
  }, []);

  const refetch = () => {
    fetchStoredVehicles(1, false);
  };

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
