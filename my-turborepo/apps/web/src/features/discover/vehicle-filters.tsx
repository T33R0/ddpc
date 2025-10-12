'use client';

import React from 'react';
import { DropdownMenu } from '@repo/ui/dropdown-menu';
import { Button } from '@repo/ui/button';
import type { VehicleSummary } from '@repo/types';

export type FilterState = {
  minYear: number | null;
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
  filterOptions: FilterOptions;
};

export function VehicleFilters({ filters, onFilterChange, filterOptions }: VehicleFiltersProps) {
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

  return (
    <div className="flex flex-wrap items-center gap-4 mb-8">
      <div className="flex flex-wrap items-center gap-4">
        <DropdownMenu options={[{ label: 'All', onClick: () => handleValueChange('minYear')(null) }, ...filterOptions.years.map(y => ({ label: y.toString(), onClick: () => handleValueChange('minYear')(y) }))]} >{filters.minYear || 'Min Year'}</DropdownMenu>
        <DropdownMenu options={[{ label: 'All', onClick: () => handleValueChange('maxYear')(null) }, ...filterOptions.years.map(y => ({ label: y.toString(), onClick: () => handleValueChange('maxYear')(y) }))]} >{filters.maxYear || 'Max Year'}</DropdownMenu>
        <DropdownMenu options={[{ label: 'All', onClick: () => handleValueChange('make')(null) }, ...filterOptions.makes.map(m => ({ label: m, onClick: () => handleValueChange('make')(m) }))]} >{filters.make || 'Make'}</DropdownMenu>
        <DropdownMenu options={[{ label: 'All', onClick: () => handleValueChange('model')(null) }, ...filteredModels.map(m => ({ label: m, onClick: () => handleValueChange('model')(m) }))]} >{filters.model || 'Model'}</DropdownMenu>
        <DropdownMenu options={[{ label: 'All', onClick: () => handleValueChange('engineType')(null) }, ...filterOptions.engineTypes.map(e => ({ label: e, onClick: () => handleValueChange('engineType')(e) }))]} >{filters.engineType || 'Engine'}</DropdownMenu>
        <DropdownMenu options={[{ label: 'All', onClick: () => handleValueChange('fuelType')(null) }, ...filterOptions.fuelTypes.map(f => ({ label: f, onClick: () => handleValueChange('fuelType')(f) }))]} >{filters.fuelType || 'Fuel'}</DropdownMenu>
        <DropdownMenu options={[{ label: 'All', onClick: () => handleValueChange('drivetrain')(null) }, ...filterOptions.drivetrains.map(d => ({ label: d, onClick: () => handleValueChange('drivetrain')(d) }))]} >{filters.drivetrain || 'Drivetrain'}</DropdownMenu>
        <DropdownMenu options={[{ label: 'All', onClick: () => handleValueChange('vehicleType')(null) }, ...filterOptions.bodyTypes.map(v => ({ label: v, onClick: () => handleValueChange('vehicleType')(v) }))]} >{filters.vehicleType || 'Type'}</DropdownMenu>
      </div>
      <div className="flex-grow" />
      <Button variant="destructive" onClick={() => onFilterChange({ minYear: null, maxYear: null, make: null, model: null, engineType: null, fuelType: null, drivetrain: null, doors: null, vehicleType: null })}>Reset</Button>
    </div>
  );
}
