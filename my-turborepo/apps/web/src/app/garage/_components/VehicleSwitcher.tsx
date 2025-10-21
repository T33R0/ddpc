'use client';

import React, { useState } from 'react';
import { Card } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
// Using native select - Select component not available

// TODO: Replace with actual vehicle data from API
const mockVehicles = [
  { id: '1', name: '2020 Honda Civic', mileage: 45000 },
  { id: '2', name: '2018 Toyota Camry', mileage: 78000 },
];

export function VehicleSwitcher() {
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');

  return (
    <Card className="p-6 bg-gray-900 border-gray-800">
      <h2 className="text-xl font-semibold text-white mb-4">Active Vehicle</h2>

      <div className="space-y-4">
        <select
          value={selectedVehicle}
          onChange={(e) => setSelectedVehicle(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500"
        >
          <option value="" disabled>Select a vehicle</option>
          {mockVehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.name} - {vehicle.mileage.toLocaleString()} miles
            </option>
          ))}
        </select>

        {selectedVehicle && (
          <div className="text-sm text-gray-400">
            <div>Current mileage: {mockVehicles.find(v => v.id === selectedVehicle)?.mileage.toLocaleString()} miles</div>
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
