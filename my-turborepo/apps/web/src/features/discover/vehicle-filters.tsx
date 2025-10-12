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

type VehicleFiltersProps = {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  vehicles: VehicleSummary[];
};

export function VehicleFilters({ filters, onFilterChange, vehicles }: VehicleFiltersProps) {
  const handleValueChange = (key: keyof FilterState) => (value: string | number | null) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const allTrims = vehicles.flatMap((summary) => summary.trims);
  const years = Array.from(new Set(vehicles.map(v => parseInt(v.year, 10)))).sort((a, b) => b - a);
  const makes = Array.from(new Set(vehicles.map(v => v.make))).sort();
  const models = Array.from(new Set(
    vehicles
      .filter(v => !filters.make || v.make === filters.make)
      .map(v => v.model)
  )).sort();
  const engineTypes = Array.from(new Set(allTrims.map(trim => trim.cylinders?.toString()).filter(Boolean))).sort() as string[];
  const fuelTypes = Array.from(new Set(allTrims.map(trim => trim.fuel_type).filter(Boolean))).sort() as string[];
  const drivetrains = Array.from(new Set(allTrims.map(trim => trim.drive_type).filter(Boolean))).sort() as string[];
  const doors = Array.from(new Set(allTrims.map(trim => trim.doors).filter(Boolean))).sort() as string[];
  const vehicleTypes = Array.from(new Set(allTrims.map(trim => trim.body_type).filter(Boolean))).sort() as string[];

  return (
    <div className="flex flex-wrap items-center gap-4 mb-8">
      <div className="flex flex-wrap items-center gap-4">
      <DropdownMenu options={[{ label: 'All', onClick: () => handleValueChange('minYear')(null) }, ...years.map(y => ({ label: y.toString(), onClick: () => handleValueChange('minYear')(y) }))]} >{filters.minYear || 'Min Year'}</DropdownMenu>
      <DropdownMenu options={[{ label: 'All', onClick: () => handleValueChange('maxYear')(null) }, ...years.map(y => ({ label: y.toString(), onClick: () => handleValueChange('maxYear')(y) }))]} >{filters.maxYear || 'Max Year'}</DropdownMenu>
      <DropdownMenu options={[{ label: 'All', onClick: () => handleValueChange('make')(null) }, ...makes.map(m => ({ label: m, onClick: () => handleValueChange('make')(m) }))]} >{filters.make || 'Make'}</DropdownMenu>
      <DropdownMenu options={[{ label: 'All', onClick: () => handleValueChange('model')(null) }, ...models.map(m => ({ label: m, onClick: () => handleValueChange('model')(m) }))]} >{filters.model || 'Model'}</DropdownMenu>
      <DropdownMenu options={[{ label: 'All', onClick: () => handleValueChange('engineType')(null) }, ...engineTypes.map(e => ({ label: e, onClick: () => handleValueChange('engineType')(e) }))]} >{filters.engineType || 'Engine'}</DropdownMenu>
      <DropdownMenu options={[{ label: 'All', onClick: () => handleValueChange('fuelType')(null) }, ...fuelTypes.map(f => ({ label: f, onClick: () => handleValueChange('fuelType')(f) }))]} >{filters.fuelType || 'Fuel'}</DropdownMenu>
      <DropdownMenu options={[{ label: 'All', onClick: () => handleValueChange('drivetrain')(null) }, ...drivetrains.map(d => ({ label: d, onClick: () => handleValueChange('drivetrain')(d) }))]} >{filters.drivetrain || 'Drivetrain'}</DropdownMenu>
      <DropdownMenu options={[{ label: 'All', onClick: () => handleValueChange('doors')(null) }, ...doors.map(d => ({ label: d.toString(), onClick: () => handleValueChange('doors')(d) }))]} >{filters.doors || 'Doors'}</DropdownMenu>
        <DropdownMenu options={[{ label: 'All', onClick: () => handleValueChange('vehicleType')(null) }, ...vehicleTypes.map(v => ({ label: v, onClick: () => handleValueChange('vehicleType')(v) }))]} >{filters.vehicleType || 'Type'}</DropdownMenu>
      </div>
      <div className="flex-grow" />
      <Button variant="destructive" onClick={() => onFilterChange({ minYear: null, maxYear: null, make: null, model: null, engineType: null, fuelType: null, drivetrain: null, doors: null, vehicleType: null })}>Reset</Button>
    </div>
  );
}
