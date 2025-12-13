'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { ExploreActionButtons } from "../../features/explore/explore-action-buttons";
import { VehicleGallery } from "../../features/explore/vehicle-gallery";
import { GalleryLoadingSkeleton } from "../../components/gallery-loading-skeleton";
import { ActiveFiltersDisplay } from "../../features/explore/active-filters-display";
import { getVehicleSummaries, getVehicleFilterOptions } from "../../lib/supabase";
import { AuthProvider } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import type { FilterState } from '../../features/explore/vehicle-filters-modal';
import { useDebounce } from '../../lib/hooks/useDebounce';
import { useExploreStore } from '../../features/explore/explore-store';

type FilterOptions = {
  years: number[];
  makes: string[];
  models: { make: string; model: string }[];
  engineTypes: string[];
  fuelTypes: string[];
  drivetrains: string[];
  bodyTypes: string[];
};

const PAGE_SIZE = 24;

function ExploreContent() {
  // Use global store with granular selectors to avoid unnecessary re-renders
  // especially when scrollPosition changes (which we don't select here)
  const vehicles = useExploreStore(state => state.vehicles);
  const page = useExploreStore(state => state.page);
  const hasMore = useExploreStore(state => state.hasMore);
  const filters = useExploreStore(state => state.filters);
  const searchQuery = useExploreStore(state => state.searchQuery);
  const isRestored = useExploreStore(state => state.isRestored);

  const setVehicles = useExploreStore(state => state.setVehicles);
  const appendVehicles = useExploreStore(state => state.appendVehicles);
  const setFilters = useExploreStore(state => state.setFilters);
  const setSearchQuery = useExploreStore(state => state.setSearchQuery);
  const setScrollPosition = useExploreStore(state => state.setScrollPosition);

  const debouncedSearch = useDebounce(searchQuery, 500);

  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(vehicles.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialLoadRef = useRef(true);

  // Restore scroll position on mount if we have vehicles or restored state
  useEffect(() => {
    // Read from state directly to avoid reactivity loop
    const currentScroll = useExploreStore.getState().scrollPosition;

    if ((isRestored || vehicles.length > 0) && currentScroll > 0) {
      // Small timeout to allow render
      setTimeout(() => {
        window.scrollTo({ top: currentScroll, behavior: 'instant' });
      }, 50);
    }
  }, [isRestored, vehicles.length]);

  // Save scroll position on unmount/scroll with debounce
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleScroll = () => {
      // Debounce writing to store to prevent performance regression
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setScrollPosition(window.scrollY);
      }, 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [setScrollPosition]);

  const loadVehicles = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const vehicleData = await getVehicleSummaries(pageNum, PAGE_SIZE, { ...filters, search: debouncedSearch });
      const newHasMore = vehicleData.length === PAGE_SIZE;

      if (append) {
        appendVehicles(vehicleData, newHasMore, pageNum);
      } else {
        setVehicles(vehicleData, newHasMore, pageNum);
      }
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load vehicles';
      setError(errorMessage);
      if (!append) {
        setVehicles([], false, 1);
      }
    } finally {
      setLoadingMore(false);
      if (!append) {
        setLoading(false);
      }
    }
  }, [debouncedSearch, filters, setVehicles, appendVehicles]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) {
      return;
    }
    const nextPage = page + 1;
    loadVehicles(nextPage, true);
  }, [page, hasMore, loadVehicles, loading, loadingMore]);

  // Handle data fetching
  useEffect(() => {
    // If we already have vehicles (restored from store), don't fetch initially unless filters changed

    // Check if this is the initial mount
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;

      // If we have data, we might skip fetch unless inputs changed externally
      if (vehicles.length > 0) {
        setLoading(false);
        return;
      }

      // No data, fetch page 1
      loadVehicles(1, false);
      return;
    }

    // Subsequent updates (search or filter changes)
    loadVehicles(1, false);
  }, [debouncedSearch, filters, loadVehicles]);

  // Load filter options immediately
  useEffect(() => {
    async function loadFilters() {
      try {
        const options = await getVehicleFilterOptions();
        if (options && typeof options === 'object') {
          setFilterOptions(options);
        } else {
          setFilterOptions({
            years: [], makes: [], models: [], engineTypes: [], fuelTypes: [], drivetrains: [], bodyTypes: []
          });
        }
      } catch (err) {
        console.error('Failed to load filter options:', err);
        setFilterOptions({
          years: [], makes: [], models: [], engineTypes: [], fuelTypes: [], drivetrains: [], bodyTypes: []
        });
      }
    }
    loadFilters();
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, [setSearchQuery]);

  const handleClearFilter = useCallback((key: keyof FilterState) => {
    setFilters({ ...filters, [key]: null });
  }, [filters, setFilters]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, [setSearchQuery]);

  return (
    <section className="relative py-12 min-h-screen">
      <div className="relative container px-4 md:px-6 pt-24">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-foreground">Explore</h1>
          <Link href="/community">
            <Button variant="outline" className="gap-2">
              Community Builds
              <ArrowRight size={16} />
            </Button>
          </Link>
        </div>

        <ExploreActionButtons
          filters={filters}
          onFilterChange={setFilters}
          filterOptions={filterOptions || { years: [], makes: [], models: [], engineTypes: [], fuelTypes: [], drivetrains: [], bodyTypes: [] }}
          onSearch={handleSearch}
        />

        <ActiveFiltersDisplay
          filters={filters}
          searchQuery={searchQuery}
          onClearFilter={handleClearFilter}
          onClearSearch={handleClearSearch}
        />

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

export default function Explore() {
  return (
    <AuthProvider supabase={supabase}>
      <ExploreContent />
    </AuthProvider>
  );
}
