'use client';

import React from 'react';
import { Card } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { useVehicles } from '@/lib/hooks/useVehicles';

interface VehicleSwitcherProps {
  selectedVehicleId: string | null;
  onVehicleSelect: (vehicleId: string | null) => void;
}

export function VehicleSwitcher({ selectedVehicleId, onVehicleSelect }: VehicleSwitcherProps) {
  const { data: vehicles, isLoading, error } = useVehicles();

  if (error) {
    return (
      <Card className="p-6 bg-gray-900 border-gray-800">
        <h2 className="text-xl font-semibold text-white mb-4">Active Vehicle</h2>
        <div className="text-center py-4">
          {error.message === 'Authentication required' ? (
            <div className="text-yellow-400">
              <p>Please sign in to view your vehicles. Use the sign in button in the header above.</p>
            </div>
          ) : (
            <div className="text-red-400">
              Failed to load vehicles
            </div>
          )}
        </div>
      </Card>
    );
  }

  if (isLoading || !vehicles) {
    return (
      <Card className="p-6 bg-gray-900 border-gray-800">
        <h2 className="text-xl font-semibold text-white mb-4">Active Vehicle</h2>
        <div className="space-y-4">
          <div className="h-10 bg-gray-800 rounded animate-pulse"></div>
          <div className="h-8 bg-gray-800 rounded animate-pulse"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gray-900 border-gray-800">
      <h2 className="text-xl font-semibold text-white mb-4">Active Vehicle</h2>

      <div className="space-y-4">
        <select
          value={selectedVehicleId || ''}
          onChange={(e) => onVehicleSelect(e.target.value || null)}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500"
        >
          <option value="" disabled>Select a vehicle</option>
          {vehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.name} - {vehicle.mileage.toLocaleString()} miles
            </option>
          ))}
        </select>

        {selectedVehicleId && (
          <div className="text-sm text-gray-400">
            <div>Current mileage: {vehicles.find(v => v.id === selectedVehicleId)?.mileage.toLocaleString()} miles</div>
          </div>
        )}

        <Button
          variant="outline"
          className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
          onClick={() => {/* TODO: Navigate to add vehicle */}}
        >
          Add New Vehicle
        </Button>
      </div>
    </Card>
  );
}
