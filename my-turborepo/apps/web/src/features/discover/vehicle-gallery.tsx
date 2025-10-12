'use client';

import React, { useState } from 'react';
import { ImageWithFallback } from '../../components/image-with-fallback';
import type { VehicleSummary } from '@repo/types';
import VehicleDetailsModal from './vehicle-details-modal';

type VehicleGalleryProps = {
  vehicles: VehicleSummary[];
};

export function VehicleGallery({ vehicles }: VehicleGalleryProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleSummary | null>(null);

  const handleOpenModal = (vehicle: VehicleSummary) => {
    setSelectedVehicle(vehicle);
  };

  const handleCloseModal = () => {
    setSelectedVehicle(null);
  };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
        {vehicles.length === 0 && (
          <div className="col-span-full text-center text-neutral-400 py-12">
            No vehicles match the selected filters.
          </div>
        )}
        {vehicles.map((vehicle) => {
          const fallbackTrim = vehicle.trims[0];
          const fallbackImageSrc = '/branding/fallback-logo.png';
          const candidateSrc = (vehicle.heroImage || fallbackTrim?.imageUrl || '')
            .split(';')[0]
            ?.trim();
          const imageSrc = candidateSrc ? candidateSrc : fallbackImageSrc;

          return (
            <div
              key={`${vehicle.year}-${vehicle.make}-${vehicle.model}`}
              className="group transition-all duration-300"
              onClick={() => handleOpenModal(vehicle)}
            >
              <div className="bg-black/50 backdrop-blur-lg rounded-2xl p-4 text-white flex flex-col gap-4 border border-transparent transition-all duration-300 group-hover:scale-105 group-hover:border-lime-400/50 group-hover:shadow-lg group-hover:shadow-lime-500/20 cursor-pointer">
                <div className="flex items-center text-xs text-neutral-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    In {Math.floor(Math.random() * 100)} garages
                  </div>
                </div>
                <ImageWithFallback
                  src={imageSrc}
                  fallbackSrc={fallbackImageSrc}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  width={400}
                  height={225}
                  className="rounded-lg object-cover aspect-video bg-white/10"
                />
                <div className="text-center">
                  <h3 className="font-bold text-lg">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                  <p className="text-neutral-400 text-sm">{fallbackTrim?.trim || 'Select a trim'}</p>
                </div>
                <div className="bg-lime-500/20 text-lime-400 text-xs text-center py-2 rounded-lg">
                  {Math.floor(Math.random() * 50)} public builds
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {selectedVehicle && (
        <VehicleDetailsModal vehicle={selectedVehicle} onClose={handleCloseModal} />
      )}
    </>
  );
}
