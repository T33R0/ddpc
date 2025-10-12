'use client';

import React, { useState } from 'react';
import { ImageWithFallback } from '../../components/image-with-fallback';
import type { Vehicle } from '@repo/types';
import type { FilterState } from './vehicle-filters';
import VehicleDetailsModal from './vehicle-details-modal';

type VehicleGalleryProps = {
  vehicles: Vehicle[];
  filters?: FilterState;
  sentinelRef?: (node: HTMLDivElement | null) => void;
  isLoadingMore?: boolean;
  hasMore?: boolean;
};

const defaultFilters: FilterState = {
  minYear: null,
  maxYear: null,
  make: null,
  model: null,
  engineType: null,
  fuelType: null,
  drivetrain: null,
  doors: null,
  vehicleType: null,
};

export function VehicleGallery({ vehicles, filters = defaultFilters, sentinelRef, isLoadingMore = false, hasMore = false }: VehicleGalleryProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const filteredVehicles = vehicles.filter(vehicle => {
    const vehicleYear = parseInt(vehicle.year, 10);

    return (
      (!filters.minYear || vehicleYear >= filters.minYear) &&
      (!filters.maxYear || vehicleYear <= filters.maxYear) &&
      (!filters.make || vehicle.make === filters.make) &&
      (!filters.model || vehicle.model === filters.model) &&
      (!filters.engineType || vehicle.cylinders?.toString() === filters.engineType) &&
      (!filters.fuelType || vehicle.fuel_type === filters.fuelType) &&
      (!filters.drivetrain || vehicle.drive_type === filters.drivetrain) &&
      (!filters.doors || vehicle.body_type === filters.doors) &&
      (!filters.vehicleType || vehicle.body_type === filters.vehicleType)
    );
  });

  const handleOpenModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const handleCloseModal = () => {
    setSelectedVehicle(null);
  };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
        {filteredVehicles.length === 0 && (
          <div className="col-span-full text-center text-neutral-400 py-12">
            No vehicles match the selected filters.
          </div>
        )}
        {filteredVehicles.map((vehicle) => (
          <div key={vehicle.id} className="group transition-all duration-300" onClick={() => handleOpenModal(vehicle)}>
            <div className="bg-black/50 backdrop-blur-lg rounded-2xl p-4 text-white flex flex-col gap-4 border border-transparent transition-all duration-300 group-hover:scale-105 group-hover:border-lime-400/50 group-hover:shadow-lg group-hover:shadow-lime-500/20 cursor-pointer">
              <div className="flex items-center text-xs text-neutral-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  In {Math.floor(Math.random() * 100)} garages
                </div>
              </div>
              <ImageWithFallback
                src={(vehicle.image_url || '').split(';')[0] || ''}
                fallbackSrc="/branding/fallback-logo.png"
                alt={`${vehicle.make} ${vehicle.model}`}
                width={400}
                height={225}
                className="rounded-lg object-cover aspect-video bg-white/10"
              />
              <div className="text-center">
                <h3 className="font-bold text-lg">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                <p className="text-neutral-400 text-sm">{vehicle.trim}</p>
              </div>
              <div className="bg-lime-500/20 text-lime-400 text-xs text-center py-2 rounded-lg">
                {Math.floor(Math.random() * 50)} public builds
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center justify-center py-8" ref={sentinelRef}>
        {isLoadingMore && (
          <div className="text-neutral-400 text-sm">Loading more vehicles...</div>
        )}
        {!isLoadingMore && !hasMore && filteredVehicles.length > 0 && (
          <div className="text-neutral-500 text-xs">You&apos;ve reached the end of the list.</div>
        )}
      </div>
      {selectedVehicle && (
        <VehicleDetailsModal vehicle={selectedVehicle} onClose={handleCloseModal} />
      )}
    </>
  );
}
