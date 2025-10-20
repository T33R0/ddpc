'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { ImageWithFallback } from '../../components/image-with-fallback';
import { getVehicleImageSources } from '../../lib/vehicle-images';
import type { Vehicle } from '@repo/types';
import toast from 'react-hot-toast';

const VehicleDetailsModal = dynamic(() => import('./garage-vehicle-details-modal'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black/80 flex items-center justify-center"><div className="text-white">Loading...</div></div>,
});

interface UserVehicle extends Vehicle {
  current_status: string;
  nickname?: string;
  title?: string;
  owner_id: string;
}

type VehicleGalleryProps = {
  vehicles: UserVehicle[];
  filters?: any;
};

export function VehicleGallery({ vehicles, filters }: VehicleGalleryProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<UserVehicle | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  React.useEffect(() => {
    // Show toast message if one is stored in session storage
    const message = sessionStorage.getItem('addVehicleMessage');
    if (message) {
      toast.success(message);
      sessionStorage.removeItem('addVehicleMessage');
    }

    const vehicleIdToOpen = searchParams.get('openVehicle');
    if (vehicleIdToOpen && vehicles.length > 0) {
      const vehicleToSelect = vehicles.find((v) => v.id === vehicleIdToOpen);
      if (vehicleToSelect) {
        setSelectedVehicle(vehicleToSelect);
        // Clean the URL
        router.replace('/garage', { scroll: false });
      }
    }
  }, [vehicles, searchParams, router]);

  const handleOpenModal = (vehicle: UserVehicle) => {
    setSelectedVehicle(vehicle);
  };

  const handleCloseModal = () => {
    setSelectedVehicle(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'daily_driver': return 'bg-green-500/20 text-green-400';
      case 'project': return 'bg-orange-500/20 text-orange-400';
      case 'weekend_warrior': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'daily_driver': return 'Daily Driver';
      case 'project': return 'Project Car';
      case 'weekend_warrior': return 'Weekend Warrior';
      default: return 'Unknown';
    }
  };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
        {vehicles.map((vehicle) => (
          <div key={vehicle.id} className="group transition-all duration-300" onClick={() => handleOpenModal(vehicle)}>
            <div className="bg-black/50 backdrop-blur-lg rounded-2xl p-4 text-white flex flex-col gap-4 border border-transparent transition-all duration-300 group-hover:scale-105 group-hover:border-lime-400/50 group-hover:shadow-lg group-hover:shadow-lime-500/20 cursor-pointer">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  My Garage
                </div>
                <div className={`px-2 py-1 rounded-full text-xs ${getStatusColor(vehicle.current_status)}`}>
                  {getStatusText(vehicle.current_status)}
                </div>
              </div>

              <ImageWithFallback
                src={getVehicleImageSources(vehicle.image_url, vehicle.make, vehicle.model, vehicle.year)}
                fallbackSrc="/branding/fallback-logo.png"
                alt={`${vehicle.make} ${vehicle.model}`}
                width={400}
                height={225}
                className="rounded-lg object-cover aspect-video bg-white/10"
              />

              <div className="text-center">
                <h3 className="font-bold text-lg">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h3>
                {vehicle.nickname && (
                  <p className="text-lime-400 text-sm font-medium">{vehicle.nickname}</p>
                )}
                <p className="text-neutral-400 text-sm">{vehicle.trim}</p>
              </div>

              <div className="bg-lime-500/20 text-lime-400 text-xs text-center py-2 rounded-lg">
                {vehicle.title || 'Ready to build'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedVehicle && (
        <VehicleDetailsModal vehicle={selectedVehicle} onClose={handleCloseModal} />
      )}
    </>
  );
}