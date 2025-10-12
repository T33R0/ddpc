'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Vehicle } from '@repo/types';
import type { FilterState } from '../../features/discover/vehicle-filters';
import { getVehicles } from '../../lib/supabase';

type UseInfiniteVehicleDiscoveryOptions = {
  pageSize?: number;
};

type UseInfiniteVehicleDiscoveryResult = {
  vehicles: Vehicle[];
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  sentinelRef: (node: HTMLDivElement | null) => void;
  hasMore: boolean;
};

const DEFAULT_PAGE_SIZE = 24;

export function useInfiniteVehicleDiscovery(
  filters: FilterState,
  { pageSize = DEFAULT_PAGE_SIZE }: UseInfiniteVehicleDiscoveryOptions = {},
): UseInfiniteVehicleDiscoveryResult {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [sentinelNode, setSentinelNode] = useState<HTMLDivElement | null>(null);

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  const fetchPage = useCallback(
    async (pageOffset: number) => {
      const data = await getVehicles({
        limit: pageSize,
        offset: pageOffset,
        filters,
      });

      return data;
    },
    [filters, pageSize],
  );

  const loadMore = useCallback(async () => {
    if (isInitialLoading || isLoadingMore || !hasMore) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const nextVehicles = await fetchPage(offset);
      setVehicles((prev) => [...prev, ...nextVehicles]);
      setOffset((prevOffset) => prevOffset + nextVehicles.length);

      if (nextVehicles.length < pageSize) {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to load more vehicles', err);
      setError(err instanceof Error ? err.message : 'Failed to load more vehicles');
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchPage, hasMore, isInitialLoading, isLoadingMore, offset, pageSize]);

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      setIsInitialLoading(true);
      setError(null);
      setHasMore(true);
      setOffset(0);
      setVehicles([]);

      try {
        const initialVehicles = await fetchPage(0);
        if (isCancelled) return;

        setVehicles(initialVehicles);
        setOffset(initialVehicles.length);
        setHasMore(initialVehicles.length === pageSize);
      } catch (err) {
        if (isCancelled) return;
        console.error('Failed to load vehicles', err);
        setError(err instanceof Error ? err.message : 'Failed to load vehicles');
        setVehicles([]);
        setHasMore(false);
      } finally {
        if (!isCancelled) {
          setIsInitialLoading(false);
        }
      }
    };

    load();

    return () => {
      isCancelled = true;
    };
  }, [fetchPage, filtersKey, pageSize]);

  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!sentinelNode) {
      return;
    }

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '200px' },
    );

    observerRef.current.observe(sentinelNode);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [loadMore, sentinelNode]);

  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    setSentinelNode(node);
  }, []);

  return {
    vehicles,
    isInitialLoading,
    isLoadingMore,
    error,
    sentinelRef,
    hasMore,
  };
}
