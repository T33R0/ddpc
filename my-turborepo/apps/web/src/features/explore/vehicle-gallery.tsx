
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { VehicleSummary } from '@/lib/types';
import VehicleDetailsModal from './vehicle-details-modal';
import { ImageWithTimeoutFallback } from '../../components/image-with-timeout-fallback';

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

// VehicleCard component definition
function VehicleCard({ vehicle }: { vehicle: VehicleSummary }) {
  return (
    <div
      className="group transition-all duration-300"
    >
      <div
        className="bg-card rounded-2xl p-6 text-foreground flex flex-col gap-6 cursor-pointer border border-border"
        style={{
          transition: 'all 0.3s ease-out',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.borderColor = 'hsl(var(--accent))';
          e.currentTarget.style.boxShadow = '0 0 30px hsl(var(--accent) / 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.borderColor = '';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div className="w-full aspect-video overflow-hidden rounded-lg bg-muted/10 relative">
          <ImageWithTimeoutFallback
            src={vehicle.heroImage || vehicle.trims[0]?.image_url || "/branding/fallback-logo.png"}
            fallbackSrc="/branding/fallback-logo.png"
            alt={`${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover"
            showMissingText={false}
          />
          {!vehicle.heroImage && !vehicle.trims[0]?.image_url && (
            <>
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-lg font-semibold tracking-wide">Vehicle Image Missing</span>
              </div>
            </>
          )}
        </div>
        <div className="flex flex-col gap-1 items-start">
          <h3 className="font-bold text-lg text-foreground">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          {vehicle.trims && vehicle.trims.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {vehicle.trims.length} Trim{vehicle.trims.length !== 1 ? 's' : ''} Available
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
            onClick={() => setSelectedVehicle({ summary: vehicle, index })}
            className="cursor-pointer"
          >
            <VehicleCard vehicle={vehicle} />
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
          onNavigate={(direction) => {
            const newIndex = direction === 'next' ? selectedVehicle.index + 1 : selectedVehicle.index - 1;
            if (newIndex >= 0 && newIndex < vehicles.length) {
              const newVehicle = vehicles[newIndex];
              if (newVehicle) {
                setSelectedVehicle({
                  summary: newVehicle,
                  index: newIndex
                });
              }
            }
          }}
          canNavigatePrev={selectedVehicle.index > 0}
          canNavigateNext={selectedVehicle.index < vehicles.length - 1}
        />
      )}
    </>
  );
}
