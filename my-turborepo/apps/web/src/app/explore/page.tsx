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
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  // Ref to track the timeout ID for debouncing
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);

      const res = await fetch(`/api/explore/search?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch results');

      const payload = await res.json();
      setAllVehicles(payload.data || []);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Failed to load vehicles');
      setAllVehicles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Initial load
  useEffect(() => {
    performSearch('');
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [performSearch]);

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

          {/* Omnibar */}
          <div className="relative max-w-2xl w-full">
            <input
              type="text"
              value={query}
              onChange={handleSearchChange}
              placeholder='Search for builds (e.g., "Overland Toyota", "Drift BMW")...'
              className="w-full h-12 px-4 rounded-lg border border-input bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-lg shadow-sm transition-all duration-200"
            />
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
            onLoadMore={() => { }} // Infinite scroll paused for V1 search
            loadingMore={false}
            hasMore={false}
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
