'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { ExploreActionButtons } from "../../features/explore/explore-action-buttons";
import { VehicleGallery } from "../../features/explore/vehicle-gallery";
import { GalleryLoadingSkeleton } from "../../components/gallery-loading-skeleton";
import { getVehicleSummaries, getVehicleFilterOptions } from "../../lib/supabase";
import type { VehicleSummary } from "@repo/types";
import { AuthProvider } from '@repo/ui/auth-context';
import { supabase } from '../../lib/supabase';
import type { SupabaseFilter, FilterOptions } from '../../features/explore/types';

const PAGE_SIZE = 24;

function ExploreContent() {
  const [allVehicles, setAllVehicles] = useState<VehicleSummary[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<SupabaseFilter[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const isInitialLoadRef = useRef(true);

  const loadVehicles = useCallback(async (page: number, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const vehicleData = await getVehicleSummaries(page, PAGE_SIZE, filters);

      setHasMore(vehicleData.length === PAGE_SIZE); // Approximation

      setAllVehicles(prev => append ? [...prev, ...vehicleData] : vehicleData);
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load vehicles';
      setError(errorMessage);
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
  }, [filters]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) {
      return;
    }
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadVehicles(nextPage, true);
  }, [currentPage, hasMore, loadVehicles, loading, loadingMore]);

  // Initial load and subsequent reloads handled by manual Apply
  useEffect(() => {
    if (isInitialLoadRef.current) {
      return;
    }
    // When filters change, we reset to page 1
    setCurrentPage(1);
    loadVehicles(1, false);
  }, [loadVehicles]); // loadVehicles depends on filters

  useEffect(() => {
    if (!isInitialLoadRef.current) {
      return;
    }

    loadVehicles(1, false).finally(() => {
      isInitialLoadRef.current = false;
    });
  }, [loadVehicles]);

  // Load filter options
  useEffect(() => {
    async function loadFilters() {
      try {
        const options = await getVehicleFilterOptions();
        if (options && typeof options === 'object') {
          setFilterOptions(options);
        } else {
          setFilterOptions({
            years: [],
            makes: [],
            models: [],
            engineTypes: [],
            fuelTypes: [],
            drivetrains: [],
            bodyTypes: [],
            countries: [],
          });
        }
      } catch (err) {
        console.error('Failed to load filter options:', err);
        setFilterOptions({
          years: [],
          makes: [],
          models: [],
          engineTypes: [],
          fuelTypes: [],
          drivetrains: [],
          bodyTypes: [],
          countries: [],
        });
      }
    }
    loadFilters();
  }, []);

  const handleApplyFilters = useCallback(() => {
    // This function is called when the user clicks "Apply" in the modal.
    // The state update in setFilters triggers the useEffect above.
    // We can also force a reload here if needed, but the effect is sufficient.
    // However, if filters didn't effectively change (same content), effect might not fire if React is smart?
    // Arrays are new references, so effect fires.
  }, []);

  return (
    <section className="relative py-12 min-h-screen">
      <div className="relative container px-4 md:px-6 pt-24">
        {/* Page Header */}
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
          filterOptions={filterOptions || {
            years: [], makes: [], models: [], engineTypes: [],
            fuelTypes: [], drivetrains: [], bodyTypes: [], countries: []
          }}
          onApply={handleApplyFilters}
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
            vehicles={allVehicles}
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
