/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { VehicleSummary } from '@repo/types';

type ImageWithTimeoutFallbackProps = {
  src: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
  timeout?: number;
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

type CommunityGalleryProps = {
  vehicles: VehicleSummary[];
  onLoadMore?: () => void;
  loadingMore?: boolean;
  hasMore?: boolean;
};

export function CommunityGallery({ vehicles, onLoadMore, loadingMore = false, hasMore = false }: CommunityGalleryProps) {
  const router = useRouter();

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

  const handleOpenVehicle = (summary: VehicleSummary) => {
    const targetSlug = summary.id;
    router.push(`/vehicle/${encodeURIComponent(targetSlug)}`);
  };

  return (
    <>
      {vehicles.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="text-muted-foreground text-lg mb-2">No community vehicles found</div>
            <div className="text-muted-foreground text-sm">Be the first to share your vehicle publicly!</div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((summary) => (
            <div
              key={summary.id}
              className="group transition-all duration-300"
              onClick={() => handleOpenVehicle(summary)}
            >
              <div
                className="bg-card text-foreground rounded-2xl p-6 flex flex-col gap-6 cursor-pointer border border-border transition-all duration-300 ease-out group-hover:scale-105 group-hover:border-accent group-hover:shadow-[0_0_30px_hsl(var(--accent)/0.6)]"
              >
                <div className="w-full aspect-video overflow-hidden rounded-lg bg-muted relative">
                  <ImageWithTimeoutFallback
                    src={
                      summary.trims[0]?.vehicle_image ||
                      summary.heroImage ||
                      summary.trims[0]?.image_url ||
                      "/branding/fallback-logo.png"
                    }
                    fallbackSrc="/branding/fallback-logo.png"
                    alt={`${summary.make} ${summary.model}`}
                    className="w-full h-full object-cover"
                    showMissingText={false}
                  />
                  {!summary.trims[0]?.vehicle_image && !summary.heroImage && !summary.trims[0]?.image_url && (
                    <>
                      <div className="absolute inset-0 bg-black/40" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-lg font-semibold tracking-wide">Vehicle Image Missing</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="text-center h-16 flex items-center justify-center">
                  <h3 className="text-2xl font-bold leading-tight line-clamp-2">
                    {summary.year} {summary.make} {summary.model} {summary.trims[0]?.trim || ''}
                  </h3>
                </div>
              </div>
            </div >
          ))
          }
        </div >
      )}

      {/* Loading more indicator */}
      {
        loadingMore && (
          <div className="flex justify-center items-center py-8">
            <div className="text-muted-foreground text-lg">Loading more vehicles...</div>
          </div>
        )
      }

      {/* No more vehicles message */}
      {
        !loadingMore && !hasMore && vehicles.length > 0 && (
          <div className="flex justify-center items-center py-8">
            <div className="text-muted-foreground text-sm">No more vehicles to load</div>
          </div>
        )
      }
    </>
  );
}
