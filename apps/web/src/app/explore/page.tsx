'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { VehicleGallery } from "../../features/explore/vehicle-gallery";
import { GalleryLoadingSkeleton } from "../../components/gallery-loading-skeleton";
import type { VehicleSummary } from "@repo/types";
import { AuthProvider } from '@repo/ui/auth-context';
import { supabase } from '../../lib/supabase';


const PAGE_SIZE = 24;



function ExploreContent() {
  const [allVehicles, setAllVehicles] = useState<VehicleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  // Advanced State


  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Ref to track the timeout ID for debouncing
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Main search/fetch logic
  const performSearch = useCallback(async (
    searchQuery: string,
    pageNum: number,
    isLoadMore = false
  ) => {
    if (!isLoadMore) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      params.set('page', pageNum.toString());
      params.set('pageSize', PAGE_SIZE.toString());

      const res = await fetch(`/api/explore/search?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch results');

      const payload = await res.json();
      const data = payload.data || [];

      const newHasMore = data.length >= PAGE_SIZE;

      setAllVehicles(prev => isLoadMore ? [...prev, ...data] : data);
      setHasMore(newHasMore);

    } catch (err) {
      console.error('Search failed:', err);
      if (!isLoadMore) setError('Failed to load vehicles');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Handle Input Change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Reset page on search
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setPage(1);
      // If query exists, Random sort doesn't really apply.
      performSearch(value, 1);
    }, 300);
  };

  // Handle Randomize Button (Shuffle)
  // New Logic: The API now handles randomization efficiently via RPC.
  // We just need to trigger a fresh fetch without a query.
  const handleRandomize = useCallback(() => {
    setQuery(''); // Clear search
    setPage(1);
    performSearch('', 1, false); // Force new fetch
  }, [performSearch]);

  // Handle Load More
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      performSearch(query, nextPage, true);
    }
  }, [loadingMore, hasMore, page, query, performSearch]);


  // Initial load
  useEffect(() => {
    // On mount, do initial random load
    handleRandomize();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="relative py-12 min-h-screen">
      <div className="relative container px-4 md:px-6 pt-24">
        {/* Page Header */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-foreground">Explore</h1>
            <Link href="/community">
              <Button variant="outline" className="gap-2">
                Community Builds
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row gap-4 max-w-4xl w-full">
            {/* Search */}
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={handleSearchChange}
                placeholder='Search for builds (e.g., "Overland Toyota", "Drift BMW")...'
                className="w-full h-12 px-4 rounded-lg border border-input bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-lg shadow-sm transition-all duration-200"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 shrink-0">
              {/* Random Button */}
              <Button
                variant="secondary"
                size="lg"
                className="h-12 px-6 gap-2"
                onClick={handleRandomize}
                title="Shuffle Vehicles"
              >
                <span className="sr-only">Randomize</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shuffle"><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l14.2-12.6c.8-1.1 2-1.7 3.3-1.7H22" /><path d="M2 6h1.4c1.3 0 2.5.6 3.3 1.7l14.2 12.6c.8 1.1 2 1.7 3.3 1.7H22" /></svg>
                Random
              </Button>
            </div>
          </div>
        </div>

        {/* Gallery or Loading State */}
        {error ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-destructive text-lg">Error: {error}</div>
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
