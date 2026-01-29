/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { VehicleSummary } from '@repo/types';
import { DashboardCard } from '@/components/dashboard-card';

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
          {vehicles.map((summary) => {
            const ymmt = `${summary.year} ${summary.make} ${summary.model} ${summary.trims[0]?.trim || ''}`.trim();
            const ownerName = summary.ownerDisplayName || 'User';
            const title = `${ownerName}'s ${ymmt}`;
            const subtitle = summary.nickname || '';

            return (
              <div key={summary.id} className="cursor-pointer" onClick={() => handleOpenVehicle(summary)}>
                <DashboardCard
                  title={title}
                  description={subtitle}
                  imageSrc={
                    summary.trims[0]?.vehicle_image ||
                    summary.heroImage ||

                    undefined
                  }
                  href={`/vehicle/${encodeURIComponent(summary.id)}`}
                  className="h-[320px] p-0"
                />
              </div>
            );
          })}
        </div>
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
