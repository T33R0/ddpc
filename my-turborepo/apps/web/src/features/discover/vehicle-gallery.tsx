'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ImageWithFallback } from '../../components/image-with-fallback';
import { getVehicleImageSources } from '../../lib/vehicle-images';
import type { VehicleSummary } from '@repo/types';
import VehicleDetailsModal from './vehicle-details-modal';

type VehicleGalleryProps = {
  vehicles: VehicleSummary[];
  onLoadMore?: () => void;
  loadingMore?: boolean;
  hasMore?: boolean;
};

type SelectedVehicle = {
  summary: VehicleSummary;
  initialTrimId?: string;
  index: number;
};

export function VehicleGallery({ vehicles, onLoadMore, loadingMore = false, hasMore = false }: VehicleGalleryProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<SelectedVehicle | null>(null);

  // Infinite scroll logic
  const handleScroll = useCallback(() => {
    if (!onLoadMore || loadingMore || !hasMore) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // Load more when user is within 300px of the bottom
    if (scrollTop + windowHeight >= documentHeight - 300) {
      onLoadMore();
    }
  }, [onLoadMore, loadingMore, hasMore]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Vehicles are already filtered at the database level, so no need for frontend filtering

  const handleOpenModal = (summary: VehicleSummary, index: number) => {
    setSelectedVehicle({
      summary,
      initialTrimId: summary.trims[0]?.id,
      index,
    });
  };

  const handleCloseModal = () => {
    setSelectedVehicle(null);
  };

  const handleNavigateVehicle = (direction: 'prev' | 'next') => {
    if (!selectedVehicle) return;
    
    const currentIndex = selectedVehicle.index;
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    
    // Check if we need to load more vehicles
    if (direction === 'next' && newIndex >= vehicles.length - 1 && hasMore && !loadingMore && onLoadMore) {
      onLoadMore();
    }
    
    // Navigate to the new vehicle if it exists
    if (newIndex >= 0 && newIndex < vehicles.length) {
      const newVehicle = vehicles[newIndex];
      if (newVehicle) {
        setSelectedVehicle({
          summary: newVehicle,
          initialTrimId: newVehicle.trims[0]?.id,
          index: newIndex,
        });
      }
    }
  };

  return (
    <>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((summary, index) => (
          <div 
            key={summary.id} 
            className="group transition-all duration-300" 
            onClick={() => handleOpenModal(summary, index)}
          >
            <div 
              className="bg-black/50 backdrop-blur-lg rounded-2xl p-4 text-white flex flex-col gap-4 cursor-pointer"
              style={{
                border: '1px solid rgba(255, 255, 255, 0.3)',
                transition: 'all 0.3s ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.border = '1px solid rgb(132, 204, 22)';
                e.currentTarget.style.boxShadow = '0 0 30px rgba(132, 204, 22, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div className="flex items-center text-xs text-neutral-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  In {Math.floor(Math.random() * 100)} garages
                </div>
              </div>
              <div className="w-full aspect-video overflow-hidden rounded-lg bg-white/10">
                <ImageWithFallback
                  src={getVehicleImageSources(
                    summary.heroImage || summary.trims[0]?.image_url,
                    summary.make,
                    summary.model,
                    summary.year
                  )}
                  fallbackSrc="/branding/fallback-logo.png"
                  alt={`${summary.make} ${summary.model}`}
                  width={400}
                  height={225}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-lg">{summary.year} {summary.make} {summary.model}</h3>
                <p className="text-neutral-400 text-sm">
                  {summary.trims[0]?.trim || `${summary.trims.length} trims available`}
                </p>
              </div>
              <div className="bg-lime-500/20 text-lime-400 text-xs text-center py-2 rounded-lg">
                {summary.trims.length} trims · {Math.floor(Math.random() * 50)} public builds
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="flex justify-center items-center py-8">
          <div className="text-white text-lg">Loading more vehicles...</div>
        </div>
      )}

      {/* No more vehicles message */}
      {!loadingMore && !hasMore && vehicles.length > 0 && (
        <div className="flex justify-center items-center py-8">
          <div className="text-neutral-400 text-sm">No more vehicles to load</div>
        </div>
      )}

      {selectedVehicle && (
        <VehicleDetailsModal
          summary={selectedVehicle.summary}
          initialTrimId={selectedVehicle.initialTrimId}
          onClose={handleCloseModal}
          onNavigate={handleNavigateVehicle}
          canNavigatePrev={selectedVehicle.index > 0}
          canNavigateNext={selectedVehicle.index < vehicles.length - 1}
        />
      )}
    </>
  );
}
