'use client';

import React, { useState } from 'react';
import { VehicleFilters, type FilterState } from "../../features/discover/vehicle-filters";
import { VehicleGallery } from "../../features/discover/vehicle-gallery";
import { AuthProvider } from '@repo/ui/auth-context';
import { supabase } from '../../lib/supabase';
import { useInfiniteVehicleDiscovery } from './use-infinite-vehicle-discovery';

function DiscoverContent() {
  const [filters, setFilters] = useState<FilterState>({ minYear: null, maxYear: null, make: null, model: null, engineType: null,
 fuelType: null, drivetrain: null, doors: null, vehicleType: null });
  const { vehicles, isInitialLoading, isLoadingMore, error, sentinelRef, hasMore } = useInfiniteVehicleDiscovery(filters);

  if (isInitialLoading) {
    return (
      <section className="relative py-12 bg-black min-h-screen">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-white text-lg">Loading vehicles...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="relative py-12 bg-black min-h-screen">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-red-400 text-lg">Error: {error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-12 bg-black">
      <div
        aria-hidden="true"
        className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20"
      >
        <div className="blur-[106px] h-56 bg-gradient-to-br from-red-500 to-purple-400" />
        <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300" />
      </div>
      <div className="relative container px-4 md:px-6 pt-24">
        <VehicleFilters filters={filters} onFilterChange={setFilters} vehicles={vehicles} />
        <VehicleGallery
          vehicles={vehicles}
          filters={filters}
          sentinelRef={sentinelRef}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
        />
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
