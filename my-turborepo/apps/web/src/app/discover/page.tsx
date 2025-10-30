'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DiscoverActionButtons } from "../../features/discover/discover-action-buttons";
import { VehicleGallery } from "../../features/discover/vehicle-gallery";
import { GalleryLoadingSkeleton } from "../../components/gallery-loading-skeleton";
import { getVehicleSummaries, getVehicleFilterOptions } from "../../lib/supabase";
import type { VehicleSummary } from "@repo/types";
import { AuthProvider } from '@repo/ui/auth-context';
import { supabase } from '../../lib/supabase';
import type { FilterState } from '../../features/discover/vehicle-filters-modal';

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
  const [allVehicles, setAllVehicles] = useState<VehicleSummary[]>([]); // For search functionality
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
  const [searchQuery, setSearchQuery] = useState<string>('');
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
        setAllVehicles(prev => [...prev, ...vehicleData]);
        setHasMore(vehicleData.length === 24); // If we got a full page, there might be more
      } else {
        setVehicles(vehicleData);
        setAllVehicles(vehicleData);
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

  // Effect to reload vehicles when filters change (but not on initial filterOptions load)
  useEffect(() => {
    // Skip if this is the initial load (vehicles array is empty means we're still loading initially)
    if (filterOptions && vehicles.length > 0) {
      loadVehicles(1, false);
      setCurrentPage(1);
      setSearchQuery(''); // Clear search when filters change
    }
  }, [filters]); // Only depend on filters, not filterOptions

  // Load filter options immediately (doesn't block UI)
  useEffect(() => {
    async function loadFilters() {
      try {
        const options = await getVehicleFilterOptions();
        setFilterOptions(options);
      } catch (err) {
        console.error('Failed to load filter options:', err);
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

        const vehicleData = await getVehicleSummaries(1, 24, filters);

        setVehicles(vehicleData);
        setAllVehicles(vehicleData);
        setHasMore(vehicleData.length === 24);
      } catch (err) {
        console.error('Failed to initialize data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    initializeVehicles();
  }, []); // Only run on mount

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setVehicles(allVehicles);
      return;
    }

    const searchLower = query.toLowerCase();
    const searchTerms = searchLower.split(/\s+/); // Split by whitespace for multi-word search

    const filtered = allVehicles.filter(vehicle => {
      // Helper function to safely check if a field contains search term
      const fieldContains = (field: any, term: string) => {
        if (field == null) return false;
        return String(field).toLowerCase().includes(term);
      };

      // Search in vehicle summary fields
      const summaryMatch = searchTerms.every(term =>
        fieldContains(vehicle.year, term) ||
        fieldContains(vehicle.make, term) ||
        fieldContains(vehicle.model, term)
      );

      // Search in trim-specific fields
      const trimMatch = vehicle.trims.some(trim =>
        searchTerms.every(term =>
          fieldContains(trim.trim, term) ||
          fieldContains(trim.trim_description, term) ||
          fieldContains(trim.body_type, term) ||
          fieldContains(trim.doors, term) ||
          fieldContains(trim.cylinders, term) ||
          fieldContains(trim.engine_size_l, term) ||
          fieldContains(trim.horsepower_hp, term) ||
          fieldContains(trim.drive_type, term) ||
          fieldContains(trim.engine_type, term) ||
          fieldContains(trim.pros, term) ||
          fieldContains(trim.cons, term) ||
          fieldContains(trim.country_of_origin, term) ||
          fieldContains(trim.car_classification, term) ||
          fieldContains(trim.platform_code_generation, term)
        )
      );

      return summaryMatch || trimMatch;
    });

    setVehicles(filtered);
  }, [allVehicles]);

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
