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
import { useSearch } from '../../lib/hooks/useSearch';
import { searchVehicleSummary } from '../../lib/search';

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
  const [allVehicles, setAllVehicles] = useState<VehicleSummary[]>([]);
  const {
    searchQuery,
    setSearchQuery,
    filteredItems: vehicles,
    handleClearSearch
  } = useSearch(allVehicles, searchVehicleSummary);

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
  // searchQuery state removed, using hook
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

      const vehicleData = await getVehicleSummaries(page, 24, filters);

      if (append) {
        setAllVehicles(prev => [...prev, ...vehicleData]);
        setHasMore(vehicleData.length === 24); // If we got a full page, there might be more
      } else {
        setAllVehicles(vehicleData);
        setHasMore(vehicleData.length === 24);
      }
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load vehicles';
      setError(errorMessage);
      // Set empty arrays on error so UI can show error state
      if (!append) {
        setAllVehicles([]);
      }
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

  // Effect to reload vehicles when filters change (after initial load)
  useEffect(() => {
    // Only reload if initial load is complete
    if (!isInitialLoadRef.current) {
      loadVehicles(1, false);
      setCurrentPage(1);
      setSearchQuery(''); // Clear search when filters change
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]); // Only depend on filters - loadVehicles is stable and depends on filters anyway

  // Load filter options immediately (doesn't block UI)
  useEffect(() => {
    async function loadFilters() {
      try {
        console.log('Loading filter options...');
        const options = await getVehicleFilterOptions();
        console.log('Filter options received:', {
          years: options?.years?.length || 0,
          makes: options?.makes?.length || 0,
          models: options?.models?.length || 0,
          engineTypes: options?.engineTypes?.length || 0,
          fuelTypes: options?.fuelTypes?.length || 0,
          drivetrains: options?.drivetrains?.length || 0,
          bodyTypes: options?.bodyTypes?.length || 0,
        });

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

  // Initialize vehicle data on mount
  useEffect(() => {
    async function initializeVehicles() {
      try {
        setLoading(true);
        setError(null);

        // Use initial filters (all null) for the first load
        const initialFilters = {
          minYear: null,
          maxYear: null,
          make: null,
          model: null,
          engineType: null,
          fuelType: null,
          drivetrain: null,
          doors: null,
          vehicleType: null,
        };
        const vehicleData = await getVehicleSummaries(1, 24, initialFilters);

        setAllVehicles(vehicleData);
        setHasMore(vehicleData.length === 24);
      } catch (err) {
        console.error('Failed to initialize data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setAllVehicles([]);
      } finally {
        setLoading(false);
        isInitialLoadRef.current = false; // Mark initial load as complete
      }
    }

    initializeVehicles();
  }, []); // Only run on mount with initial filters

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, [setSearchQuery]);

  const handleClearFilter = useCallback((key: keyof FilterState) => {
    setFilters(prev => ({ ...prev, [key]: null }));
  }, []);

  // handleClearSearch is provided by useSearch

  return (
    <section className="relative py-12 min-h-screen">
      <div className="relative container px-4 md:px-6 pt-24">
        {/* Page Header */}
        <h1 className="text-4xl font-bold text-white mb-8">Discover</h1>

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
            hasMore={hasMore && !searchQuery}
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
