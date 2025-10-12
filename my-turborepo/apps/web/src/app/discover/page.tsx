'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VehicleFilters, type FilterState } from "../../features/discover/vehicle-filters";
import { VehicleGallery } from "../../features/discover/vehicle-gallery";
import { fetchVehicleSummaries, supabase, type VehicleSummaryFilters } from "../../lib/supabase";
import type { VehicleSummary } from "@repo/types";
import { AuthProvider } from '@repo/ui/auth-context';

function DiscoverContent() {
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [filterInventory, setFilterInventory] = useState<VehicleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({ minYear: null, maxYear: null, make: null, model: null, engineType: null, fuelType: null, drivetrain: null, doors: null, vehicleType: null });
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const offsetRef = useRef(0);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const hasMoreRef = useRef(hasMore);
  const isFetchingRef = useRef(isFetchingMore);

  const pageSize = 12;

  const activeFilters = useMemo<VehicleSummaryFilters>(() => ({
    minYear: filters.minYear,
    maxYear: filters.maxYear,
    make: filters.make,
    model: filters.model,
    engineType: filters.engineType,
    fuelType: filters.fuelType,
    drivetrain: filters.drivetrain,
    doors: filters.doors,
    vehicleType: filters.vehicleType,
  }), [filters]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    isFetchingRef.current = isFetchingMore;
  }, [isFetchingMore]);

  const loadVehicles = useCallback(
    async ({ reset }: { reset: boolean }) => {
      if (reset) {
        offsetRef.current = 0;
        setHasMore(true);
        hasMoreRef.current = true;
        setIsFetchingMore(true);
        isFetchingRef.current = true;
        setError(null);
      } else {
        if (!hasMoreRef.current || isFetchingRef.current) {
          return;
        }
        setIsFetchingMore(true);
        isFetchingRef.current = true;
      }

      try {
        const data = await fetchVehicleSummaries({
          limit: pageSize,
          offset: reset ? 0 : offsetRef.current,
          filters: activeFilters,
        });

        if (reset) {
          setVehicles(data);
        } else {
          setVehicles(prev => [...prev, ...data]);
        }

        offsetRef.current = reset ? data.length : offsetRef.current + data.length;
        const moreAvailable = data.length === pageSize;
        setHasMore(moreAvailable);
        hasMoreRef.current = moreAvailable;
      } catch (err) {
        console.error('Failed to fetch vehicles:', err);
        const message = err instanceof Error ? err.message : 'Failed to load vehicles';
        if (reset) {
          setError(message);
          setVehicles([]);
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
        setIsFetchingMore(false);
        isFetchingRef.current = false;
      }
    },
    [activeFilters, pageSize]
  );

  const loadFilterInventory = useCallback(async () => {
    try {
      const data = await fetchVehicleSummaries({ limit: 500, offset: 0, filters: { minYear: 1990 } });
      setFilterInventory(data);
    } catch (err) {
      console.error('Failed to load filter options:', err);
    }
  }, []);

  useEffect(() => {
    loadFilterInventory();
  }, [loadFilterInventory]);

  useEffect(() => {
    setLoading(true);
    loadVehicles({ reset: true });
  }, [activeFilters, loadVehicles]);

  useEffect(() => {
    const current = loaderRef.current;

    if (!current) return;

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        loadVehicles({ reset: false });
      }
    }, { rootMargin: '200px' });

    observer.observe(current);

    return () => {
      observer.disconnect();
    };
  }, [loadVehicles]);

  if (loading) {
    return (
      <section className="relative py-12 bg-black min-h-screen">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-white text-lg">Loading vehicles...</div>
        </div>
      </section>
    );
  }

  if (error && vehicles.length === 0) {
    return (
      <section className="relative py-12 bg-black min-h-screen">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-red-400 text-lg">Error: {error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-12 bg-black">
      <div
        aria-hidden="true"
        className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20"
      >
        <div className="blur-[106px] h-56 bg-gradient-to-br from-red-500 to-purple-400" />
        <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300" />
      </div>
      <div className="relative container px-4 md:px-6 pt-24">
        <VehicleFilters filters={filters} onFilterChange={setFilters} vehicles={filterInventory} />
        <VehicleGallery vehicles={vehicles} />
        {error && vehicles.length > 0 && (
          <div className="text-red-400 text-sm text-center mt-4">
            {error}
          </div>
        )}
        <div ref={loaderRef} className="py-8 text-center text-neutral-400 text-sm">
          {isFetchingMore ? 'Loading more vehicles...' : hasMore ? 'Scroll to load more vehicles' : 'You have reached the end'}
        </div>
      </div>
    </section>
  );
}

export default function Discover() {
  return (
    <AuthProvider supabase={supabase}>
      <DiscoverContent />
    </AuthProvider>
  );
}
