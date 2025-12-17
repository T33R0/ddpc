'use client';

import React, { useState } from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@repo/ui/modal';
import { FilterBuilder } from './filter-builder';
import type { SupabaseFilter, FilterOptions } from './types';

type ExploreActionButtonsProps = {
  filters: SupabaseFilter[];
  onFilterChange: (filters: SupabaseFilter[]) => void;
  filterOptions: FilterOptions;
  onApply: () => void;
};

export function ExploreActionButtons({
  filters,
  onFilterChange,
  filterOptions,
  onApply
}: ExploreActionButtonsProps) {
  const [showFilter, setShowFilter] = useState(false);

  // Local state for the modal, so we only apply on "Apply"
  const [localFilters, setLocalFilters] = useState<SupabaseFilter[]>(filters);

  const handleOpen = () => {
    setLocalFilters(filters);
    setShowFilter(true);
  };

  const handleApply = () => {
    onFilterChange(localFilters);
    onApply(); // Trigger the reload
    setShowFilter(false);
  };

  const handleReset = () => {
    onFilterChange([]);
    onApply();
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Button
            onClick={handleOpen}
            variant="outline"
            className="flex items-center justify-center gap-2 bg-secondary/50 border-border hover:bg-secondary text-foreground flex-1 sm:flex-none sm:w-[150px]"
          >
            <Filter className="w-4 h-4" />
            Advanced Filters
            {filters.length > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                {filters.length}
              </span>
            )}
          </Button>
        </div>

        {filters.length > 0 && (
          <button
            onClick={handleReset}
            className="text-red-500 hover:text-red-400 transition-colors text-sm font-medium"
          >
            Reset Filters
          </button>
        )}
      </div>

      <Modal open={showFilter} onOpenChange={setShowFilter}>
        <ModalContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <ModalHeader>
            <ModalTitle>Filter Options</ModalTitle>
          </ModalHeader>
          <ModalBody className="px-6 pb-6 overflow-y-auto">
             <FilterBuilder
                filters={localFilters}
                onChange={setLocalFilters}
                options={filterOptions}
             />
          </ModalBody>
          <ModalFooter className="mt-auto px-6 py-4 border-t border-border">
             <div className="flex justify-end gap-2 w-full">
                <Button variant="ghost" onClick={() => setShowFilter(false)}>Cancel</Button>
                <Button onClick={handleApply}>Apply Filters</Button>
             </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
