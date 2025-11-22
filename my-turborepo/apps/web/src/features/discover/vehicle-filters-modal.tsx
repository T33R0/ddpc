'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '@repo/ui/dialog';
import { DropdownMenu } from '@repo/ui/dropdown-menu';
import { Button } from '@repo/ui/button';

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

type VehicleFiltersModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  filterOptions: FilterOptions;
};

export function VehicleFiltersModal({
  open,
  onOpenChange,
  filters,
  onFilterChange,
  filterOptions
}: VehicleFiltersModalProps) {
  const handleValueChange = (key: keyof FilterState) => (value: string | number | null) => {
    onFilterChange({ ...filters, [key]: value });
  };

  // Filter models based on selected make
  const filteredModels = filters.make
    ? filterOptions.models.filter((model: string) => {
      // Note: This is a simplified approach. In a real app, you'd need to know which models belong to which makes
      // For now, we'll show all models when a make is selected
      return true;
    })
    : filterOptions.models;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Filter Vehicles</DialogTitle>
          <DialogDescription>
            Filter vehicles by year, make, model, engine type, fuel type, drivetrain, or body type
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="px-6 pb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <DropdownMenu
              className="w-full"
              options={[
                { label: 'All', onClick: () => handleValueChange('minYear')(null) },
                ...filterOptions.years.map((y: number) => ({
                  label: y.toString(),
                  onClick: () => handleValueChange('minYear')(y)
                }))
              ]}
            >
              <span className="text-foreground">{filters.minYear || 'Min Year'}</span>
            </DropdownMenu>

            <DropdownMenu
              className="w-full"
              options={[
                { label: 'All', onClick: () => handleValueChange('maxYear')(null) },
                ...filterOptions.years.map((y: number) => ({
                  label: y.toString(),
                  onClick: () => handleValueChange('maxYear')(y)
                }))
              ]}
            >
              <span className="text-foreground">{filters.maxYear || 'Max Year'}</span>
            </DropdownMenu>

            <DropdownMenu
              className="w-full"
              options={[
                { label: 'All', onClick: () => handleValueChange('make')(null) },
                ...filterOptions.makes.map((m: string) => ({
                  label: m,
                  onClick: () => handleValueChange('make')(m)
                }))
              ]}
            >
              <span className="text-foreground">{filters.make || 'Make'}</span>
            </DropdownMenu>

            <DropdownMenu
              className="w-full"
              options={[
                { label: 'All', onClick: () => handleValueChange('model')(null) },
                ...filteredModels.map((m: string) => ({
                  label: m,
                  onClick: () => handleValueChange('model')(m)
                }))
              ]}
            >
              <span className="text-foreground">{filters.model || 'Model'}</span>
            </DropdownMenu>

            <DropdownMenu
              className="w-full"
              options={[
                { label: 'All', onClick: () => handleValueChange('engineType')(null) },
                ...filterOptions.engineTypes.map((e: string) => ({
                  label: e,
                  onClick: () => handleValueChange('engineType')(e)
                }))
              ]}
            >
              <span className="text-foreground">{filters.engineType || 'Engine'}</span>
            </DropdownMenu>

            <DropdownMenu
              className="w-full"
              options={[
                { label: 'All', onClick: () => handleValueChange('fuelType')(null) },
                ...filterOptions.fuelTypes.map((f: string) => ({
                  label: f,
                  onClick: () => handleValueChange('fuelType')(f)
                }))
              ]}
            >
              <span className="text-foreground">{filters.fuelType || 'Fuel'}</span>
            </DropdownMenu>

            <DropdownMenu
              className="w-full"
              options={[
                { label: 'All', onClick: () => handleValueChange('drivetrain')(null) },
                ...filterOptions.drivetrains.map((d: string) => ({
                  label: d,
                  onClick: () => handleValueChange('drivetrain')(d)
                }))
              ]}
            >
              <span className="text-foreground">{filters.drivetrain || 'Drivetrain'}</span>
            </DropdownMenu>

            <DropdownMenu
              className="w-full"
              options={[
                { label: 'All', onClick: () => handleValueChange('vehicleType')(null) },
                ...filterOptions.bodyTypes.map((v: string) => ({
                  label: v,
                  onClick: () => handleValueChange('vehicleType')(v)
                }))
              ]}
            >
              <span className="text-foreground">{filters.vehicleType || 'Type'}</span>
            </DropdownMenu>
          </div>

          <DialogFooter className="mt-6 pt-4 border-t border-border">
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
            >
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

