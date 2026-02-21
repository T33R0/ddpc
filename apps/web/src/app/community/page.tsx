'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CommunityGallery } from "../../features/community/community-gallery";
import { GalleryLoadingSkeleton } from "../../components/gallery-loading-skeleton";
import type { VehicleSummary } from "@repo/types";
import { AuthProvider } from '@/components/auth/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Search, X } from 'lucide-react';
import { Input } from '@repo/ui/input';
import { useSearch } from '../../lib/hooks/useSearch';
import { searchVehicleSummary } from '../../lib/search';

function CommunityContent() {
  const [allVehicles, setAllVehicles] = useState<VehicleSummary[]>([]);
  const {
    searchQuery,
    setSearchQuery: handleSearch,
    filteredItems: vehicles,
    handleClearSearch
  } = useSearch(allVehicles, searchVehicleSummary);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
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



  return (
    <div className="relative min-h-screen bg-background">
      <div>
        <section className="relative py-12 min-h-screen bg-background text-foreground">
          <div className="relative container px-4 md:px-6 pt-24">
            {/* Page Header */}
            <h1 className="text-4xl font-bold mb-8 text-foreground">Community Hub</h1>

            {/* Search Bar */}
            <div className="mb-8 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search community vehicles..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-10 bg-card border-input text-foreground placeholder-muted-foreground focus:border-ring focus:ring-ring"
                />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Active Search Display */}
            {searchQuery && (
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 bg-accent/20 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-2">
                  <span className="text-accent-foreground text-sm">
                    Showing {vehicles.length} result{vehicles.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
                  </span>
                  <button
                    onClick={handleClearSearch}
                    className="text-muted-foreground hover:text-foreground transition-colors ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Gallery or Loading State */}
            {error ? (
              <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-destructive text-lg">Error: {error}</div>
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
      </div>
    </div>
  );
}

export default function Community() {
  const supabase = createClient();
  return (
    <AuthProvider supabase={supabase}>
      <CommunityContent />
    </AuthProvider>
  );
}
