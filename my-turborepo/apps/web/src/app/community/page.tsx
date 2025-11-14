'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CommunityGallery } from "../../features/community/community-gallery";
import { GalleryLoadingSkeleton } from "../../components/gallery-loading-skeleton";
import type { VehicleSummary } from "@repo/types";
import { AuthProvider } from '@repo/ui/auth-context';
import { supabase } from '../../lib/supabase';
import { Search, X } from 'lucide-react';
import { Input } from '@repo/ui/input';

function CommunityContent() {
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [allVehicles, setAllVehicles] = useState<VehicleSummary[]>([]); // For search functionality
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
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

      const response = await fetch(`/api/community/vehicles?page=${page}&pageSize=24`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message = (errorBody && errorBody.error) || 'Failed to fetch community vehicles';
        throw new Error(message);
      }

      const payload = await response.json();
      const vehicleData = payload.data || [];

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
      const errorMessage = err instanceof Error ? err.message : 'Failed to load vehicles';
      setError(errorMessage);
      // Set empty arrays on error so UI can show error state
      if (!append) {
        setVehicles([]);
        setAllVehicles([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadVehicles(nextPage, true);
    }
  }, [currentPage, loadingMore, hasMore, loadVehicles]);

  // Initialize vehicle data on mount
  useEffect(() => {
    loadVehicles(1, false);
    isInitialLoadRef.current = false; // Mark initial load as complete
  }, [loadVehicles]); // Include loadVehicles in dependencies

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

      // Search in trim-specific fields (user vehicle data)
      const trimMatch = vehicle.trims.some(trim =>
        searchTerms.every(term =>
          fieldContains(trim.nickname, term) ||
          fieldContains(trim.trim, term) ||
          fieldContains(trim.trim_description, term) ||
          fieldContains(trim.body_type, term) ||
          fieldContains(trim.engine_type, term) ||
          fieldContains(trim.fuel_type, term) ||
          fieldContains(trim.drive_type, term) ||
          fieldContains(trim.transmission, term) ||
          fieldContains(trim.cylinders, term) ||
          fieldContains(trim.engine_size_l, term) ||
          fieldContains(trim.horsepower_hp, term)
        )
      );

      return summaryMatch || trimMatch;
    });

    setVehicles(filtered);
  }, [allVehicles]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setVehicles(allVehicles);
  }, [allVehicles]);

  return (
    <section className="relative py-12 min-h-screen">
      <div className="relative container px-4 md:px-6 pt-24">
        {/* Page Header */}
        <h1 className="text-4xl font-bold text-white mb-8">Community Hub</h1>

        {/* Search Bar */}
        <div className="mb-8 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search community vehicles..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-10 bg-black/30 backdrop-blur-sm border-white/20 text-white placeholder-gray-400 focus:border-white/40 focus:ring-white/20"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Active Search Display */}
        {searchQuery && (
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 bg-blue-600/20 backdrop-blur-sm border border-blue-500/30 rounded-lg px-4 py-2">
              <span className="text-blue-300 text-sm">
                Showing {vehicles.length} result{vehicles.length !== 1 ? 's' : ''} for "{searchQuery}"
              </span>
              <button
                onClick={handleClearSearch}
                className="text-blue-300 hover:text-white transition-colors ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Gallery or Loading State */}
        {error ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-red-400 text-lg">Error: {error}</div>
          </div>
        ) : loading ? (
          <GalleryLoadingSkeleton />
        ) : (
          <CommunityGallery
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

export default function Community() {
  return (
    <AuthProvider supabase={supabase}>
      <CommunityContent />
    </AuthProvider>
  );
}
