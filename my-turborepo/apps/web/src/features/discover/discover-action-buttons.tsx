'use client';

import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { VehicleFiltersModal, type FilterState } from './vehicle-filters-modal';
import { SearchModal } from './search-modal';

type DiscoverActionButtonsProps = {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  filterOptions: any;
  onSearch: (query: string) => void;
};

export function DiscoverActionButtons({ 
  filters, 
  onFilterChange, 
  filterOptions,
  onSearch 
}: DiscoverActionButtonsProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const handleReset = () => {
    onFilterChange({
      minYear: null,
      maxYear: null,
      make: null,
      model: null,
      engineType: null,
      fuelType: null,
      drivetrain: null,
      doors: null,
      vehicleType: null,
    });
    onSearch(''); // Clear search as well
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-white text-lg font-medium">Find your next vehicle:</span>
          <Button
            onClick={() => setShowSearch(true)}
            variant="outline"
            className="flex items-center justify-center gap-2 bg-gray-900/50 border-gray-700 hover:bg-gray-800 text-white w-[150px]"
          >
            <Search className="w-4 h-4" />
            Search
          </Button>
          
          <Button
            onClick={() => setShowFilter(true)}
            variant="outline"
            className="flex items-center justify-center gap-2 bg-gray-900/50 border-gray-700 hover:bg-gray-800 text-white w-[150px]"
          >
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>
        
        <button
          onClick={handleReset}
          className="text-red-500 hover:text-red-400 transition-colors text-sm font-medium"
        >
          Reset
        </button>
      </div>

      <SearchModal 
        open={showSearch} 
        onOpenChange={setShowSearch}
        onSearch={onSearch}
      />

      <VehicleFiltersModal
        open={showFilter}
        onOpenChange={setShowFilter}
        filters={filters}
        onFilterChange={onFilterChange}
        filterOptions={filterOptions}
      />
    </>
  );
}

