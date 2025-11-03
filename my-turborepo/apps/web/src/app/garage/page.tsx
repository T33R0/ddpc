'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useVehicles, useStoredVehicles } from '@/lib/hooks/useVehicles';
import { Card, CardContent } from '@repo/ui/card';
import AddVehicleModal from '../../features/garage/add-vehicle-modal';
import { AuthProvider } from '@repo/ui/auth-context';
import { supabase } from '../../lib/supabase';

type ImageWithTimeoutFallbackProps = {
  src: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
  timeout?: number; // in milliseconds
};

function ImageWithTimeoutFallback({
  src,
  fallbackSrc,
  alt,
  className,
  timeout = 3000
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
      <img
        src={fallbackSrc}
        alt={alt}
        className={className}
      />
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

interface Vehicle {
  id: string;
  name: string;
  nickname?: string;
  ymmt: string;
  odometer: number | null;
  current_status: string;
  image_url?: string;
}

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const router = useRouter();


  // Format status for display
  const formatStatus = (status: string) => {
    switch (status) {
      case 'daily_driver':
        return 'Active';
      case 'parked':
        return 'Parked';
      case 'listed':
        return 'Listed';
      case 'sold':
        return 'Sold';
      case 'retired':
        return 'Retired';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const handleClick = () => {
    // Use nickname for URL
    // Next.js handles URL encoding automatically
    const urlSlug = vehicle.nickname;
    router.push(`/vehicle/${urlSlug}`);
  };

  return (
    <div
      className="group transition-all duration-300 cursor-pointer"
      onClick={handleClick}
    >
      <div
        className="bg-black/50 backdrop-blur-lg rounded-2xl p-4 text-white flex flex-col gap-4"
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
            <span>Owned</span>
          </div>
        </div>
        <div className="w-full aspect-video overflow-hidden rounded-lg bg-white/10">
          <ImageWithTimeoutFallback
            src={vehicle.image_url || "https://images.unsplash.com/photo-1494905998402-395d579af36f?w=400&h=225&fit=crop&crop=center"}
            fallbackSrc="/branding/fallback-logo.png"
            alt={`${vehicle.name} vehicle`}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-bold text-lg">{vehicle.name}</h3>
          </div>
          <div className="text-right text-sm text-gray-400">
            {vehicle.ymmt}
          </div>
        </div>
        <div className="bg-lime-500/20 text-lime-400 text-xs text-center py-2 rounded-lg">
          {formatStatus(vehicle.current_status)} · {vehicle.odometer ? `${vehicle.odometer.toLocaleString()} mi` : 'No mileage'}
        </div>
      </div>
    </div>
  );
}

function AddVehicleCard({ onClick }: { onClick: () => void }) {
  return (
    <Card
      className="min-h-[250px] border-2 border-dashed border-gray-700 bg-transparent hover:bg-gray-900/50 hover:border-red-500/50 transition-colors duration-300 cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="flex items-center justify-center h-full p-6">
        <div className="flex flex-col items-center justify-center text-gray-400 hover:text-red-400 transition-colors duration-300">
          <Plus className="text-4xl mb-2" />
          <span className="text-sm font-semibold">Add a Vehicle</span>
        </div>
      </CardContent>
    </Card>
  );
}


function VehicleGallery({ title, vehicles, showAddCard, onAddClick, onLoadMore, loadingMore, hasMore }: {
  title: string;
  vehicles: Vehicle[];
  showAddCard?: boolean;
  onAddClick?: () => void;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  hasMore?: boolean;
}) {
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
    if (onLoadMore) {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll, onLoadMore]);

  if (vehicles.length === 0 && !showAddCard) {
    return null;
  }

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {vehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}

        {showAddCard && (
          <AddVehicleCard onClick={onAddClick || (() => {})} />
        )}
      </div>

      {loadingMore && (
        <div className="flex justify-center mt-8">
          <div className="text-gray-400">Loading more vehicles...</div>
        </div>
      )}
    </div>
  );
}

function GarageContent() {
  const { data: vehiclesData, isLoading: activeLoading, refetch: refetchVehicles } = useVehicles();
  const { vehicles: storedVehicles, isLoading: storedLoading, loadingMore, hasMore, loadMore } = useStoredVehicles();
  const [addVehicleModalOpen, setAddVehicleModalOpen] = useState(false);

  const allVehicles = vehiclesData?.vehicles || [];
  const activeVehicles = allVehicles.filter(vehicle => vehicle.current_status === 'daily_driver');

  // Show add vehicle card only if active vehicles < 3
  const canAddVehicle = activeVehicles.length < 3;

  // Function to refresh garage data when vehicles are added or updated
  const handleVehicleAdded = () => {
    refetchVehicles();
    // Stored vehicles will be refetched when the section is scrolled/loaded
  };

  if (activeLoading) {
    return (
      <section className="relative py-12 bg-black min-h-screen">
        <div className="relative container px-4 md:px-6 pt-24">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">My Garage</h1>
            <p className="text-xl text-gray-300">Loading your garage...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="relative py-12 bg-black min-h-screen">
        <div
          aria-hidden="true"
          className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20"
        >
          <div className="blur-[106px] h-56 bg-gradient-to-br from-red-500 to-purple-400" />
          <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300" />
        </div>

        <div className="relative container px-4 md:px-6 pt-24">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-white mb-2">My Garage</h1>
            <p className="text-lg text-gray-400">Here's your garage</p>
          </div>

          {/* Active Vehicles Section */}
          <VehicleGallery
            title="Active Vehicles"
            vehicles={activeVehicles}
            showAddCard={canAddVehicle}
            onAddClick={() => setAddVehicleModalOpen(true)}
          />

          {/* Stored Vehicles Section */}
          <VehicleGallery
            title="Stored Vehicles"
            vehicles={storedVehicles}
            onLoadMore={loadMore}
            loadingMore={loadingMore}
            hasMore={hasMore}
          />

          {storedLoading && storedVehicles.length === 0 && (
            <div className="flex justify-center mt-8">
              <div className="text-gray-400">Loading stored vehicles...</div>
            </div>
          )}
        </div>
      </section>

      <AddVehicleModal {...({ open: addVehicleModalOpen, onOpenChange: setAddVehicleModalOpen, onVehicleAdded: handleVehicleAdded } as any)} />
    </>
  );
}

export default function Garage() {
  return (
    <AuthProvider supabase={supabase}>
      <GarageContent />
    </AuthProvider>
  );
}
