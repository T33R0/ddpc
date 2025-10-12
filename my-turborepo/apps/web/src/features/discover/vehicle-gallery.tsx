'use client';

import React, { useState } from 'react';
import { ImageWithFallback } from '../../components/image-with-fallback';
import type { VehicleSummary } from '@repo/types';
import type { FilterState } from './vehicle-filters';
import VehicleDetailsModal from './vehicle-details-modal';

type VehicleGalleryProps = {
  vehicles: VehicleSummary[];
  filters: FilterState;
};

type SelectedVehicle = {
  summary: VehicleSummary;
  initialTrimId?: string;
};

export function VehicleGallery({ vehicles, filters }: VehicleGalleryProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<SelectedVehicle | null>(null);

  const filteredVehicles = vehicles.filter((summary) => {
    const vehicleYear = parseInt(summary.year, 10);

    const matchesBaseFilters =
      (!filters.minYear || vehicleYear >= filters.minYear) &&
      (!filters.maxYear || vehicleYear <= filters.maxYear) &&
      (!filters.make || summary.make === filters.make) &&
      (!filters.model || summary.model === filters.model);

    if (!matchesBaseFilters) {
      return false;
    }

    return summary.trims.some((trim) => (
      (!filters.engineType || trim.cylinders?.toString() === filters.engineType) &&
      (!filters.fuelType || trim.fuel_type === filters.fuelType) &&
      (!filters.drivetrain || trim.drive_type === filters.drivetrain) &&
      (!filters.doors || trim.doors === filters.doors) &&
      (!filters.vehicleType || trim.body_type === filters.vehicleType)
    ));
  });

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
        {filteredVehicles.map((summary) => (
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
