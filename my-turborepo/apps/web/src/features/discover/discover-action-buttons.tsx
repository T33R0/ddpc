'use client';

import React, { useState } from 'react';
import { Search, Filter, Sparkles } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { VehicleFiltersModal, type FilterState } from './vehicle-filters-modal';
import { SearchModal } from './search-modal';
import { ScrutineerModal } from './scrutineer-modal';

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
  const [showScrutineer, setShowScrutineer] = useState(false);

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
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className="text-white text-lg font-medium">Find your next vehicle:</span>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => setShowSearch(true)}
            variant="outline"
            className="flex items-center justify-center gap-2 bg-gray-900/50 border-gray-700 hover:bg-gray-800 text-white w-[140px]"
          >
            <Search className="w-4 h-4" />
            Search
          </Button>
          
          <Button
            onClick={() => setShowFilter(true)}
            variant="outline"
            className="flex items-center justify-center gap-2 bg-gray-900/50 border-gray-700 hover:bg-gray-800 text-white w-[140px]"
          >
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          
          <Button
            onClick={() => setShowScrutineer(true)}
            variant="outline"
            className="flex items-center justify-center gap-2 bg-gray-900/50 border-gray-700 hover:bg-gray-800 text-white w-[140px]"
          >
            <Sparkles className="w-4 h-4" />
            Scrutineer
          </Button>
          
          <button
            onClick={handleReset}
            className="text-gray-400 hover:text-white transition-colors text-sm underline underline-offset-4"
          >
            Reset
          </button>
        </div>
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

      <ScrutineerModal
        open={showScrutineer}
        onOpenChange={setShowScrutineer}
      />
    </>
  );
}

