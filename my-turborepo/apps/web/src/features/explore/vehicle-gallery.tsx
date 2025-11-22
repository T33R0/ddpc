'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { VehicleSummary } from '@repo/types';
import VehicleDetailsModal from './vehicle-details-modal';

type ImageWithTimeoutFallbackProps = {
  src: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
  timeout?: number; // in milliseconds
  showMissingText?: boolean;
};

function ImageWithTimeoutFallback({
  src,
  fallbackSrc,
  alt,
  className,
  timeout = 3000,
  showMissingText = false
}: ImageWithTimeoutFallbackProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!imageLoaded) {
        setShowFallback(true);
      }
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout, imageLoaded]);

  if (showFallback) {
    return (
      <div className="relative w-full h-full">
        <img
          src={fallbackSrc}
          alt={alt}
          className={className}
        />
        {showMissingText && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
              <span className="text-white text-lg font-semibold">Image Missing</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onLoad={() => setImageLoaded(true)}
      onError={() => setShowFallback(true)}
    />
  );
}

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
      {vehicles.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="text-gray-400 text-lg mb-2">No vehicles found</div>
            <div className="text-gray-500 text-sm">Try adjusting your search terms or filters</div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((summary, index) => (
            <div
              key={summary.id}
              className="group transition-all duration-300"
              onClick={() => handleOpenModal(summary, index)}
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
                <div className="w-full aspect-video overflow-hidden rounded-lg bg-muted/10">
                  <ImageWithTimeoutFallback
                    src={summary.heroImage || summary.trims[0]?.image_url || "https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center"}
                    fallbackSrc="/branding/fallback-logo.png"
                    alt={`${summary.make} ${summary.model}`}
                    className="w-full h-full object-cover"
                    showMissingText={true}
                  />
                </div>
                <div className="flex flex-col gap-1 items-start">
                  <h3 className="font-bold text-lg text-foreground">
                    {summary.year} {summary.make} {summary.model}
                  </h3>
                  {/* Explore cards don't have nickname/YMMT separation in the same way, 
                    but we align the style. We could add trim info here if available. */}
                  {summary.trims && summary.trims.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {summary.trims.length} Trim{summary.trims.length !== 1 ? 's' : ''} Available
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
          open={true}
        />
      )}
    </>
  );
}
