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

type SortOption = 'random' | 'newest' | 'year_desc' | 'year_asc';

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const valI = newArray[i];
    const valJ = newArray[j];
    if (valI !== undefined && valJ !== undefined) {
      newArray[i] = valJ;
      newArray[j] = valI;
    }
  }
  return newArray;
}

function ExploreContent() {
  const [allVehicles, setAllVehicles] = useState<VehicleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  // Advanced State
  const [sort, setSort] = useState<SortOption>('random');
  const [vehicleIds, setVehicleIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Ref to track the timeout ID for debouncing
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all IDs for random shuffle
  const fetchAllIds = useCallback(async () => {
    try {
      const res = await fetch('/api/explore/search?mode=ids');
      if (!res.ok) throw new Error('Failed to fetch IDs');
      const data = await res.json();
      return data.ids as string[];
    } catch (err) {
      console.error('Failed to fetch IDs:', err);
      return [];
    }
  }, []);

  // Main search/fetch logic
  const performSearch = useCallback(async (
    searchQuery: string,
    currentSort: SortOption,
    pageNum: number,
    currentIds: string[] = [], // For random mode
    isLoadMore = false
  ) => {
    if (!isLoadMore) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      let data: VehicleSummary[] = [];
      let newHasMore = false;

      // 1. Random Mode (No Query)
      if (!searchQuery && currentSort === 'random') {
        // If we don't have IDs yet, fetch and shuffle them
        let targetIds = currentIds;
        if (pageNum === 1 && (targetIds.length === 0)) {
          const ids = await fetchAllIds();
          targetIds = shuffleArray(ids);
          setVehicleIds(targetIds);
        } else if (pageNum === 1 && targetIds.length > 0) {
          // Check if we need to re-shuffle for a "new" random (e.g. initial load or reset)
          // If pageNum is 1, and we passed in currentIds, we assume they are already prepared.
          setVehicleIds(targetIds);
        }

        // Slice IDs for current page
        const start = (pageNum - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        const pageIds = targetIds.slice(start, end);

        if (pageIds.length > 0) {
          const params = new URLSearchParams();
          params.set('ids', pageIds.join(','));
          const res = await fetch(`/api/explore/search?${params.toString()}`);
          if (!res.ok) throw new Error('Failed to fetch vehicle details');
          const payload = await res.json();
          data = payload.data || [];
        }

        newHasMore = targetIds.length > end;
      }
      // 2. Standard Search / Sort
      else {
        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        if (!searchQuery && currentSort !== 'random') params.set('sort', currentSort);

        params.set('page', pageNum.toString());
        params.set('pageSize', PAGE_SIZE.toString());

        const res = await fetch(`/api/explore/search?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch results');

        const payload = await res.json();
        data = payload.data || [];
        // Heuristic: if we got less than requested (or exactly 0), no more. 
        // Note: API fetches extra for grouping, so checking length against 0 is safe, 
        // but for accurate infinite scroll we usually check if data.length >= PAGE_SIZE (approx).
        // The API returns distinct groups. If we got groups, we might have more.
        newHasMore = data.length >= PAGE_SIZE;
        // If query is present, it might return fewer results total. 
        // Ideally API should return hasMore. For now, this heuristic works okay-ish.
      }

      setAllVehicles(prev => isLoadMore ? [...prev, ...data] : data);
      setHasMore(newHasMore);

    } catch (err) {
      console.error('Search failed:', err);
      if (!isLoadMore) setError('Failed to load vehicles');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [fetchAllIds]);

  // Handle Input Change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Reset sort to 'random' if clearing query? Or keep?
    // User flow: user searches -> sees results. User clears -> sees random?
    // Let's keep current sort logic but reset page.

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setPage(1);
      // If query exists, Random sort doesn't really apply (it's semantic search).
      // Pass current sort, but performSearch handles precedence.
      performSearch(value, sort, 1, vehicleIds);
    }, 300);
  };

  // Handle Sort Change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value as SortOption;
    setSort(newSort);
    setPage(1);

    if (newSort === 'random') {
      // Trigger new random shuffle
      handleRandomize();
    } else {
      performSearch(query, newSort, 1);
    }
  };

  // Handle Randomize Button
  const handleRandomize = async () => {
    setSort('random');
    setPage(1);
    // Re-fetch ALL IDs and shuffle to get a truly new random set
    setLoading(true);
    const ids = await fetchAllIds();
    const shuffled = shuffleArray(ids);
    performSearch(query, 'random', 1, shuffled);
  };

  // Handle Load More
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      performSearch(query, sort, nextPage, vehicleIds, true);
    }
  }, [loadingMore, hasMore, page, query, sort, vehicleIds, performSearch]);


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
                {/* Shuffle Icon inline since usage of module isn't confirmed, usually Lucide Shuffle */}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shuffle"><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l14.2-12.6c.8-1.1 2-1.7 3.3-1.7H22" /><path d="M2 6h1.4c1.3 0 2.5.6 3.3 1.7l14.2 12.6c.8 1.1 2 1.7 3.3 1.7H22" /></svg>
                Random
              </Button>

              {/* Sort Dropdown */}
              <div className="relative h-12">
                <select
                  value={sort}
                  onChange={handleSortChange}
                  className="h-full pl-4 pr-10 rounded-lg border border-input bg-background/50 hover:bg-background transition-colors appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="random">Random</option>
                  <option value="newest">Newest Added</option>
                  <option value="year_desc">Year (High to Low)</option>
                  <option value="year_asc">Year (Low to High)</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6" /></svg>
                </div>
              </div>
            </div>
          </div>
        </div>

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
