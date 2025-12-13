
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { VehicleSummary } from '@/lib/types';
import VehicleDetailsModal from './vehicle-details-modal';
import { VehicleCard } from '@/components/vehicle-card';

interface FilterOptions {
  years: number[];
  makes: string[];
  models: { make: string; model: string }[];
  engineTypes: string[];
  fuelTypes: string[];
  drivetrains: string[];
  bodyTypes: string[];
}

interface SelectedVehicle {
  summary: VehicleSummary;
  initialTrimId?: string;
  index: number;
}

interface VehicleGalleryProps {
  vehicles: VehicleSummary[];
  onLoadMore?: () => void;
  loadingMore?: boolean;
  hasMore?: boolean;
  filterOptions?: FilterOptions;
  initialVehicles?: VehicleSummary[]; // Keep for backward compatibility if needed, but prefer vehicles
}

export function VehicleGallery({ vehicles, onLoadMore, loadingMore, hasMore }: VehicleGalleryProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<SelectedVehicle | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore && onLoadMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, onLoadMore]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle, index) => (
          <div
            key={vehicle.id}
          >
            <VehicleCard
                title={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                subtitle={vehicle.trims && vehicle.trims.length > 0 ? `${vehicle.trims.length} Trim${vehicle.trims.length !== 1 ? 's' : ''} Available` : undefined}
                imageUrl={vehicle.heroImage || vehicle.trims[0]?.image_url}
                onClick={() => setSelectedVehicle({ summary: vehicle, index })}
                className="cursor-pointer"
            />
          </div>
        ))}
      </div>

      {/* No results message */}
      {vehicles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">No vehicles found matching your criteria</p>
        </div>
      )}

      {/* Infinite Scroll Trigger */}

      {hasMore && (
        <div
          ref={observerTarget}
          className="h-20 flex justify-center items-center mt-8"
        >
          {loadingMore && (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          )}
        </div>
      )}

      {/* Vehicle Details Modal */}
      {selectedVehicle && (
        <VehicleDetailsModal
          open={!!selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          summary={selectedVehicle.summary}
          canNavigatePrev={selectedVehicle.index > 0}
          canNavigateNext={selectedVehicle.index < vehicles.length - 1}
          onNavigate={(direction) => {
            const newIndex = direction === 'next' ? selectedVehicle.index + 1 : selectedVehicle.index - 1;
            if (newIndex >= 0 && newIndex < vehicles.length) {
              const nextVehicle = vehicles[newIndex];
              if (nextVehicle) {
                setSelectedVehicle({
                  summary: nextVehicle,
                  index: newIndex,
                  initialTrimId: undefined // Reset trim selection when navigating
                });
              }
            }
          }}
        />
      )}
    </>
  );
}
