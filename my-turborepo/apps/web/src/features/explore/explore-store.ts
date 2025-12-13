import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { VehicleSummary } from '@repo/types';
import type { FilterState } from './vehicle-filters-modal';

interface ExploreState {
  vehicles: VehicleSummary[];
  page: number;
  hasMore: boolean;
  filters: FilterState;
  searchQuery: string;
  scrollPosition: number;
  isRestored: boolean; // Flag to indicate if we are restoring from cache

  setVehicles: (vehicles: VehicleSummary[], hasMore: boolean, page: number) => void;
  appendVehicles: (vehicles: VehicleSummary[], hasMore: boolean, page: number) => void;
  setFilters: (filters: FilterState) => void;
  setSearchQuery: (query: string) => void;
  setScrollPosition: (position: number) => void;
  reset: () => void;
  setRestored: () => void;
}

const defaultFilters: FilterState = {
  minYear: null,
  maxYear: null,
  make: null,
  model: null,
  engineType: null,
  fuelType: null,
  drivetrain: null,
  doors: null,
  vehicleType: null
};

export const useExploreStore = create<ExploreState>()(
  persist(
    (set) => ({
      vehicles: [],
      page: 1,
      hasMore: true,
      filters: defaultFilters,
      searchQuery: '',
      scrollPosition: 0,
      isRestored: false,

      setVehicles: (vehicles, hasMore, page) => set({
        vehicles,
        hasMore,
        page,
        isRestored: true // If we set vehicles manually, we consider it restored/active
      }),

      appendVehicles: (newVehicles, hasMore, page) => set((state) => ({
        vehicles: [...state.vehicles, ...newVehicles],
        hasMore,
        page
      })),

      setFilters: (filters) => set({ filters, page: 1 }), // Reset page when filters change

      setSearchQuery: (query) => set({ searchQuery: query, page: 1 }), // Reset page when search changes

      setScrollPosition: (position) => set({ scrollPosition: position }),

      setRestored: () => set({ isRestored: true }),

      reset: () => set({
        vehicles: [],
        page: 1,
        hasMore: true,
        filters: defaultFilters,
        searchQuery: '',
        scrollPosition: 0,
        isRestored: false
      })
    }),
    {
      name: 'explore-storage',
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => (state) => {
        state?.setRestored();
      }
    }
  )
);
