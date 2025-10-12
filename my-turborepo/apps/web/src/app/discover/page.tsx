'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { VehicleFilters, type FilterState } from "../../features/discover/vehicle-filters";
import { VehicleGallery } from "../../features/discover/vehicle-gallery";
import { getVehicleSummaries, getVehicleFilterOptions } from "../../lib/supabase";
import type { VehicleSummary } from "@repo/types";
import { AuthProvider } from '@repo/ui/auth-context';
import { supabase } from '../../lib/supabase';

type FilterOptions = {
  years: number[];
  makes: string[];
  models: string[];
  engineTypes: string[];
  fuelTypes: string[];
  drivetrains: string[];
  bodyTypes: string[];
};

function DiscoverContent() {
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({ minYear: null, maxYear: null, make: null, model: null, engineType: null, fuelType: null, drivetrain: null, doors: null, vehicleType: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadVehicles = useCallback(async (page: number, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const vehicleData = await getVehicleSummaries(page, 24, filters);

      if (append) {
        setVehicles(prev => [...prev, ...vehicleData]);
        setHasMore(vehicleData.length === 24); // If we got a full page, there might be more
      } else {
        setVehicles(vehicleData);
        setHasMore(vehicleData.length === 24);
      }
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load vehicles');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadVehicles(nextPage, true);
    }
  }, [currentPage, loadingMore, hasMore, loadVehicles]);

  // Effect to reload vehicles when filters change
  useEffect(() => {
    if (filterOptions) { // Only reload if filter options are loaded
      loadVehicles(1, false);
      setCurrentPage(1);
    }
  }, [filters, filterOptions, loadVehicles]);

  useEffect(() => {
    async function initializeData() {
      try {
        setLoading(true);
        setError(null);

        // Load filter options first
        const options = await getVehicleFilterOptions();
        setFilterOptions(options);

        // Load first page of vehicles (this will be triggered by the filter effect above)
      } catch (err) {
        console.error('Failed to initialize data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setLoading(false);
      }
    }

    initializeData();
  }, []); // Remove loadVehicles dependency to avoid infinite loops

  if (loading || !filterOptions) {
    return (
      <section className="relative py-12 bg-black min-h-screen">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-white text-lg">Loading vehicles...</div>
        </div>
      </section>
    );
  }

  if (error) {
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
        <VehicleFilters filters={filters} onFilterChange={setFilters} filterOptions={filterOptions} />
        <VehicleGallery vehicles={vehicles} onLoadMore={loadMore} loadingMore={loadingMore} hasMore={hasMore} />
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
