'use client';

import React, { useState } from 'react';
import { DropdownMenu } from '@repo/ui/dropdown-menu';
import { Button } from '@repo/ui/button';
import type { VehicleSummary } from '@repo/types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '@repo/ui/auth-context';

export type FilterState = {
  minYear?: number | null;
  maxYear: number | null;
  make: string | null;
  model: string | null;
  engineType: string | null;
  fuelType: string | null;
  drivetrain: string | null;
  doors: string | null;
  vehicleType: string | null;
};

type FilterOptions = {
  years: number[];
  makes: string[];
  models: string[];
  engineTypes: string[];
  fuelTypes: string[];
  drivetrains: string[];
  bodyTypes: string[];
};

type VehicleFiltersProps = {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  filterOptions: any;
};

export function VehicleFilters({ filters, onFilterChange, filterOptions }: VehicleFiltersProps) {
  const { session } = useAuth();
  const [vin, setVin] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  const handleValueChange = (key: keyof FilterState) => (value: string | number | null) => {
    onFilterChange({ ...filters, [key]: value });
  };

  // Filter models based on selected make
  const filteredModels = filters.make
    ? filterOptions.models.filter(model => {
        // Note: This is a simplified approach. In a real app, you'd need to know which models belong to which makes
        // For now, we'll show all models when a make is selected
        return true;
      })
    : filterOptions.models;

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
    setAddSuccess(null);

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

      setAddSuccess(`Vehicle added successfully! You can view it in your garage.`);
      setVin('');

    } catch (error) {
      setAddError(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="mb-8 p-4 bg-gray-900/50 rounded-lg">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <DropdownMenu options={[{ label: 'All', onClick: () => handleValueChange('minYear')(null) }, ...filterOptions.years.map(y => ({ label: y.toString(), onClick: () => handleValueChange('minYear')(y) }))]} >{filters.minYear || 'Min Year'}</DropdownMenu>
        <DropdownMenu options={[{ label: 'All', onClick: () => handleValueChange('maxYear')(null) }, ...filterOptions.years.map(y => ({ label: y.toString(), onClick: () => handleValueChange('maxYear')(y) }))]} >{filters.maxYear || 'Max Year'}</DropdownMenu>
        <DropdownMenu options={[{ label: 'All', onClick: () => handleValueChange('make')(null) }, ...filterOptions.makes.map(m => ({ label: m, onClick: () => handleValueChange('make')(m) }))]} >{filters.make || 'Make'}</DropdownMenu>
        <DropdownMenu options={[{ label: 'All', onClick: () => handleValueChange('model')(null) }, ...filteredModels.map(m => ({ label: m, onClick: () => handleValueChange('model')(m) }))]} >{filters.model || 'Model'}</DropdownMenu>
        <DropdownMenu options={[{ label: 'All', onClick: () => handleValueChange('engineType')(null) }, ...filterOptions.engineTypes.map(e => ({ label: e, onClick: () => handleValueChange('engineType')(e) }))]} >{filters.engineType || 'Engine'}</DropdownMenu>
        <DropdownMenu options={[{ label: 'All', onClick: () => handleValueChange('fuelType')(null) }, ...filterOptions.fuelTypes.map(f => ({ label: f, onClick: () => handleValueChange('fuelType')(f) }))]} >{filters.fuelType || 'Fuel'}</DropdownMenu>
        <DropdownMenu options={[{ label: 'All', onClick: () => handleValueChange('drivetrain')(null) }, ...filterOptions.drivetrains.map(d => ({ label: d, onClick: () => handleValueChange('drivetrain')(d) }))]} >{filters.drivetrain || 'Drivetrain'}</DropdownMenu>
        <DropdownMenu options={[{ label: 'All', onClick: () => handleValueChange('vehicleType')(null) }, ...filterOptions.bodyTypes.map(v => ({ label: v, onClick: () => handleValueChange('vehicleType')(v) }))]} >{filters.vehicleType || 'Type'}</DropdownMenu>
      </div>

      {/* Add by VIN Section */}
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
        {addSuccess && <p className="text-green-400 mt-2">{addSuccess}</p>}
      </div>
    </div>
  );
}
