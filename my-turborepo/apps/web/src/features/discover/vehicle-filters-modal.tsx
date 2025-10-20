'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@repo/ui/dialog';
import { DropdownMenu } from '@repo/ui/dropdown-menu';

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
        </DialogHeader>
        <DialogBody>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <DropdownMenu 
              options={[
                { label: 'All', onClick: () => handleValueChange('minYear')(null) }, 
                ...filterOptions.years.map((y: number) => ({ 
                  label: y.toString(), 
                  onClick: () => handleValueChange('minYear')(y) 
                }))
              ]}
            >
              {filters.minYear || 'Min Year'}
            </DropdownMenu>
            
            <DropdownMenu 
              options={[
                { label: 'All', onClick: () => handleValueChange('maxYear')(null) }, 
                ...filterOptions.years.map((y: number) => ({ 
                  label: y.toString(), 
                  onClick: () => handleValueChange('maxYear')(y) 
                }))
              ]}
            >
              {filters.maxYear || 'Max Year'}
            </DropdownMenu>
            
            <DropdownMenu 
              options={[
                { label: 'All', onClick: () => handleValueChange('make')(null) }, 
                ...filterOptions.makes.map((m: string) => ({ 
                  label: m, 
                  onClick: () => handleValueChange('make')(m) 
                }))
              ]}
            >
              {filters.make || 'Make'}
            </DropdownMenu>
            
            <DropdownMenu 
              options={[
                { label: 'All', onClick: () => handleValueChange('model')(null) }, 
                ...filteredModels.map((m: string) => ({ 
                  label: m, 
                  onClick: () => handleValueChange('model')(m) 
                }))
              ]}
            >
              {filters.model || 'Model'}
            </DropdownMenu>
            
            <DropdownMenu 
              options={[
                { label: 'All', onClick: () => handleValueChange('engineType')(null) }, 
                ...filterOptions.engineTypes.map((e: string) => ({ 
                  label: e, 
                  onClick: () => handleValueChange('engineType')(e) 
                }))
              ]}
            >
              {filters.engineType || 'Engine'}
            </DropdownMenu>
            
            <DropdownMenu 
              options={[
                { label: 'All', onClick: () => handleValueChange('fuelType')(null) }, 
                ...filterOptions.fuelTypes.map((f: string) => ({ 
                  label: f, 
                  onClick: () => handleValueChange('fuelType')(f) 
                }))
              ]}
            >
              {filters.fuelType || 'Fuel'}
            </DropdownMenu>
            
            <DropdownMenu 
              options={[
                { label: 'All', onClick: () => handleValueChange('drivetrain')(null) }, 
                ...filterOptions.drivetrains.map((d: string) => ({ 
                  label: d, 
                  onClick: () => handleValueChange('drivetrain')(d) 
                }))
              ]}
            >
              {filters.drivetrain || 'Drivetrain'}
            </DropdownMenu>
            
            <DropdownMenu 
              options={[
                { label: 'All', onClick: () => handleValueChange('vehicleType')(null) }, 
                ...filterOptions.bodyTypes.map((v: string) => ({ 
                  label: v, 
                  onClick: () => handleValueChange('vehicleType')(v) 
                }))
              ]}
            >
              {filters.vehicleType || 'Type'}
            </DropdownMenu>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-700 flex justify-end">
            <button
              onClick={() => onOpenChange(false)}
              className="bg-lime-500 hover:bg-lime-600 text-black font-bold py-2 px-6 rounded-lg transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

