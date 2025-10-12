'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ImageWithFallback } from '../../components/image-with-fallback';
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

  const handleOpenModal = (summary: VehicleSummary) => {
    setSelectedVehicle({
      summary,
      initialTrimId: summary.trims[0]?.id,
    });
  };

  const handleCloseModal = () => {
    setSelectedVehicle(null);
  };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
        {vehicles.map((summary) => (
          <div key={summary.id} className="group transition-all duration-300" onClick={() => handleOpenModal(summary)}>
            <div className="bg-black/50 backdrop-blur-lg rounded-2xl p-4 text-white flex flex-col gap-4 border border-transparent transition-all duration-300 group-hover:scale-105 group-hover:border-lime-400/50 group-hover:shadow-lg group-hover:shadow-lime-500/20 cursor-pointer">
              <div className="flex items-center text-xs text-neutral-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  In {Math.floor(Math.random() * 100)} garages
                </div>
              </div>
              <ImageWithFallback
                src={summary.heroImage || summary.trims[0]?.primaryImage || summary.trims[0]?.image_url?.split(';')[0] || ''}
                fallbackSrc="/branding/fallback-logo.png"
                alt={`${summary.make} ${summary.model}`}
                width={400}
                height={225}
                className="rounded-lg object-cover aspect-video bg-white/10"
              />
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
        />
      )}
    </>
  );
}
