'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DiscoverActionButtons } from "../../features/discover/discover-action-buttons";
import { VehicleGallery } from "../../features/discover/vehicle-gallery";
import { GalleryLoadingSkeleton } from "../../components/gallery-loading-skeleton";
import { ActiveFiltersDisplay } from "../../features/discover/active-filters-display";
import { getVehicleSummaries, getVehicleFilterOptions } from "../../lib/supabase";
import type { VehicleSummary } from "@repo/types";
import { AuthProvider } from '@repo/ui/auth-context';
import { supabase } from '../../lib/supabase';
import type { FilterState } from '../../features/discover/vehicle-filters-modal';
import { useDebounce } from '../../lib/hooks/useDebounce';

type FilterOptions = {
  years: number[];
  makes: string[];
  models: string[];
  engineTypes: string[];
  fuelTypes: string[];
  drivetrains: string[];
  bodyTypes: string[];
};

const PAGE_SIZE = 24;

function DiscoverContent() {
  const [allVehicles, setAllVehicles] = useState<VehicleSummary[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  // We no longer use client-side filtering
  const vehicles = allVehicles;

  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    minYear: null,
    maxYear: null,
    make: null,
    model: null,
    engineType: null,
    fuelType: null,
    drivetrain: null,
    doors: null,
    vehicleType: null
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const isInitialLoadRef = useRef(true);

  const loadVehicles = useCallback(async (page: number, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null); // Clear previous errors when starting a new load
      }

      const vehicleData = await getVehicleSummaries(page, PAGE_SIZE, { ...filters, search: debouncedSearch });

      setHasMore(vehicleData.length === PAGE_SIZE);

      setAllVehicles(prev => append ? [...prev, ...vehicleData] : vehicleData);
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load vehicles';
      setError(errorMessage);
      // Set empty arrays on error so UI can show error state
      if (!append) {
        setAllVehicles([]);
      }
      setHasMore(false);
    } finally {
      setLoadingMore(false);
      if (!append) {
        setLoading(false);
      }
    }
  }, [debouncedSearch, filters]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) {
      return;
    }
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadVehicles(nextPage, true);
  }, [currentPage, hasMore, loadVehicles, loading, loadingMore]);

  // Effect to reload vehicles when filters or search changes
  useEffect(() => {
    if (isInitialLoadRef.current) {
      return;
    }

    setCurrentPage(1);
    loadVehicles(1, false);
  }, [loadVehicles]);

  useEffect(() => {
    if (!isInitialLoadRef.current) {
      return;
    }

    loadVehicles(1, false).finally(() => {
      isInitialLoadRef.current = false;
    });
  }, [loadVehicles]);

  // Load filter options immediately (doesn't block UI)
  useEffect(() => {
    async function loadFilters() {
      try {
        const options = await getVehicleFilterOptions();

        // Validate that we got a proper response
        if (options && typeof options === 'object') {
          setFilterOptions(options);
        } else {
          console.error('Invalid filter options format:', options);
          setFilterOptions({
            years: [],
            makes: [],
            models: [],
            engineTypes: [],
            fuelTypes: [],
            drivetrains: [],
            bodyTypes: []
          });
        }
      } catch (err) {
        console.error('Failed to load filter options:', err);
        // Set empty arrays on error so UI doesn't break
        setFilterOptions({
          years: [],
          makes: [],
          models: [],
          engineTypes: [],
          fuelTypes: [],
          drivetrains: [],
          bodyTypes: []
        });
      }
    }
    loadFilters();
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    // Reset to page 1 is handled by the effect on debouncedSearch
  }, []);

  const handleClearFilter = useCallback((key: keyof FilterState) => {
    setFilters(prev => ({ ...prev, [key]: null }));
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return (
    <section className="relative py-12 min-h-screen">
      <div className="relative container px-4 md:px-6 pt-24">
        {/* Page Header */}
        <h1 className="text-4xl font-bold text-foreground mb-8">Discover</h1>

        {/* Action Buttons - Always show immediately */}
        <DiscoverActionButtons
          filters={filters}
          onFilterChange={setFilters}
          filterOptions={filterOptions || { years: [], makes: [], models: [], engineTypes: [], fuelTypes: [], drivetrains: [], bodyTypes: [] }}
          onSearch={handleSearch}
        />

        {/* Active Filters/Search Display */}
        <ActiveFiltersDisplay
          filters={filters}
          searchQuery={searchQuery}
          onClearFilter={handleClearFilter}
          onClearSearch={handleClearSearch}
        />

        {/* Gallery or Loading State */}
        {error ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-red-400 text-lg">Error: {error}</div>
          </div>
        ) : loading ? (
          <GalleryLoadingSkeleton />
        ) : (
          <VehicleGallery
            vehicles={vehicles}
            onLoadMore={loadMore}
            loadingMore={loadingMore}
            hasMore={hasMore}
          />
        )}
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
