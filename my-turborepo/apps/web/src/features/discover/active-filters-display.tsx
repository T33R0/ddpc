'use client';

import React from 'react';
import { X } from 'lucide-react';
import type { FilterState } from './vehicle-filters-modal';

type ActiveFiltersDisplayProps = {
  filters: FilterState;
  searchQuery: string;
  onClearFilter?: (key: keyof FilterState) => void;
  onClearSearch?: () => void;
};

export function ActiveFiltersDisplay({ 
  filters, 
  searchQuery, 
  onClearFilter,
  onClearSearch 
}: ActiveFiltersDisplayProps) {
  const activeFilters: Array<{ key: keyof FilterState; label: string; value: string }> = [];

  // Build array of active filters
  if (filters.minYear) {
    activeFilters.push({ key: 'minYear', label: 'Min Year', value: filters.minYear.toString() });
  }
  if (filters.maxYear) {
    activeFilters.push({ key: 'maxYear', label: 'Max Year', value: filters.maxYear.toString() });
  }
  if (filters.make) {
    activeFilters.push({ key: 'make', label: 'Make', value: filters.make });
  }
  if (filters.model) {
    activeFilters.push({ key: 'model', label: 'Model', value: filters.model });
  }
  if (filters.engineType) {
    activeFilters.push({ key: 'engineType', label: 'Engine', value: filters.engineType });
  }
  if (filters.fuelType) {
    activeFilters.push({ key: 'fuelType', label: 'Fuel', value: filters.fuelType });
  }
  if (filters.drivetrain) {
    activeFilters.push({ key: 'drivetrain', label: 'Drivetrain', value: filters.drivetrain });
  }
  if (filters.vehicleType) {
    activeFilters.push({ key: 'vehicleType', label: 'Type', value: filters.vehicleType });
  }

  // Don't render if there are no active filters or search query
  if (activeFilters.length === 0 && !searchQuery) {
    return null;
  }

  return (
    <div className="mb-6">
      <div 
        className="bg-black/50 backdrop-blur-lg rounded-2xl p-4"
        style={{
          border: '1px solid rgba(255, 255, 255, 0.3)',
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-gray-300 text-sm font-medium mr-2">Active:</span>
          
          {/* Search Query Badge */}
          {searchQuery && (
            <div 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 text-sm"
            >
              <span>Search: &quot;{searchQuery}&quot;</span>
              {onClearSearch && (
                <button
                  onClick={onClearSearch}
                  className="hover:text-blue-200 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Filter Badges */}
          {activeFilters.map((filter) => (
            <div
              key={filter.key}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/30 backdrop-blur-sm border border-white/20 text-white text-sm"
            >
              <span className="text-gray-300">{filter.label}:</span>
              <span>{filter.value}</span>
              {onClearFilter && (
                <button
                  onClick={() => onClearFilter(filter.key)}
                  className="hover:text-gray-300 transition-colors"
                  aria-label={`Clear ${filter.label}`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

