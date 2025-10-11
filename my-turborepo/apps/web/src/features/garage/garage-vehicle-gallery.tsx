'use client';

import React, { useState } from 'react';
import { ImageWithFallback } from '../../components/image-with-fallback';
import type { Vehicle } from '@repo/types';
import VehicleDetailsModal from './garage-vehicle-details-modal';

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
                src={vehicle.image_url || ''}
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
