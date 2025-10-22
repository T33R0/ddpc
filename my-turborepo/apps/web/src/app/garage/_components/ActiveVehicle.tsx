'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { useVehicles } from '@/lib/hooks/useVehicles';

type Vehicle = {
  id: string;
  name: string;
  ymmt: string;
  odometer: number | null;
};

interface ActiveVehicleProps {
  selectedVehicleId: string | null;
  onVehicleSelect: (vehicleId: string | null) => void;
}

export function ActiveVehicle({ selectedVehicleId, onVehicleSelect }: ActiveVehicleProps) {
  const { data: vehiclesData, isLoading, error } = useVehicles();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    if (vehiclesData) {
      setVehicles(vehiclesData.vehicles || []);

      // If no vehicle is selected, default to preferred or first vehicle
      if (!selectedVehicleId) {
        const defaultVehicleId = vehiclesData.preferredVehicleId ?? vehiclesData.vehicles?.[0]?.id ?? null;
        if (defaultVehicleId) {
          onVehicleSelect(defaultVehicleId);
        }
      }
    }
  }, [vehiclesData, selectedVehicleId, onVehicleSelect]);

  const handleVehicleChange = async (vehicleId: string) => {
    try {
      const response = await fetch('/api/garage/set-active-vehicle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vehicleId }),
      });

      if (!response.ok) {
        console.error('Failed to set active vehicle');
        return;
      }

      onVehicleSelect(vehicleId);
    } catch (error) {
      console.error('Error setting active vehicle:', error);
    }
  };

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

  if (vehicles.length === 0) {
    return (
      <Card className="p-6 bg-gray-900 border-gray-800">
        <h2 className="text-xl font-semibold text-white mb-4">Active Vehicle</h2>
        <div className="text-center py-4">
          <p className="text-gray-400 mb-4">No vehicles found. Add your first vehicle to get started.</p>
          <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
            Add Vehicle
          </Button>
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
          onChange={(e) => handleVehicleChange(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500"
        >
          <option value="" disabled>Select a vehicle</option>
          {vehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.name} - {vehicle.odometer?.toLocaleString() || 'Unknown'} miles
            </option>
          ))}
        </select>

        {selectedVehicleId && (
          <div className="text-sm text-gray-400">
            <div>Current mileage: {vehicles.find(v => v.id === selectedVehicleId)?.odometer?.toLocaleString() || 'Unknown'} miles</div>
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
