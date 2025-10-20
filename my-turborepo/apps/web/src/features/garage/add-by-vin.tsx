'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@repo/ui/auth-context';

type AddByVinProps = {
  onSuccess?: (vehicleId: string) => void;
};

export function AddByVin({ onSuccess }: AddByVinProps) {
  const router = useRouter();
  const { session } = useAuth();
  const [vin, setVin] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const handleVinAdd = async () => {
    if (!vin) {
      setAddError('Please enter a VIN.');
      return;
    }
    if (!session) {
      setAddError('You must be logged in to add a vehicle.');
      return;
    }

    setIsAdding(true);
    setAddError(null);
    
    try {
      const response = await fetch('/api/garage/add-vehicle-by-vin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ vin }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add vehicle');
      }

      // Store a temporary success message in session storage to display after navigation
      if (!result.matchFound) {
        sessionStorage.setItem('addVehicleMessage', "We don't know much about the vehicle you entered. Please help us learn more about your ride.");
      } else {
        sessionStorage.setItem('addVehicleMessage', 'Vehicle successfully added to your garage!');
      }

      if (onSuccess) {
        onSuccess(result.vehicleId);
      } else {
        // Navigate to the garage and open the new vehicle's modal
        router.push(`/garage?openVehicle=${result.vehicleId}`);
      }

    } catch (error) {
      setAddError(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-2">Quick Add by VIN</h3>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={vin}
          onChange={(e) => setVin(e.target.value)}
          placeholder="Enter 17-digit VIN"
          className="flex-grow bg-gray-800 text-white placeholder-gray-500 rounded-md px-3 py-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-lime-500"
        />
        <button
          onClick={handleVinAdd}
          disabled={isAdding}
          className="bg-lime-500 hover:bg-lime-600 text-black font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50"
        >
          {isAdding ? 'Adding...' : 'Add to Garage'}
        </button>
      </div>
      {addError && <p className="text-red-400 mt-2">{addError}</p>}
    </div>
  );
}

