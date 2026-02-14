'use client';

import React, { useEffect, useState } from 'react';
import { PartCard } from './components/PartCard';
import { AddPartModal } from './components/AddPartModal';
import { ComponentDetailModal } from './components/ComponentDetailModal';
import { getPartsData } from './actions';
import { PartSlot, UserVehicle, VehicleInstalledComponent } from './types';
import { Loader2, AlertCircle, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/alert';
import { STANDARD_COMPONENTS, PartCategory } from '@/lib/constants/standard-components';
import { Button } from '@repo/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select';

// Categories Configuration
const CATEGORIES: { label: string; id: PartCategory }[] = [
  { label: 'Engine', id: 'engine' },
  { label: 'Suspension', id: 'suspension' },
  { label: 'Braking', id: 'brakes' },
  { label: 'Wheels & Tires', id: 'wheels_tires' },
  { label: 'Interior', id: 'interior' },
  { label: 'Exterior', id: 'exterior' },
];

interface PartsDiagramContainerProps {
  vehicleId: string;
}

export default function PartsDiagramContainer({ vehicleId }: PartsDiagramContainerProps) {
  // State
  const [activeCategory, setActiveCategory] = useState<PartCategory>('engine');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<PartSlot[]>([]);
  const [inventory, setInventory] = useState<VehicleInstalledComponent[]>([]);
  const [vehicle, setVehicle] = useState<UserVehicle | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isBlueprintExpanded, setIsBlueprintExpanded] = useState(true); // Default open
  const [selectedSlotForAdd, setSelectedSlotForAdd] = useState<PartSlot | null>(null);
  const [selectedSlotForDetail, setSelectedSlotForDetail] = useState<PartSlot | null>(null);

  // Fetch Data on Mount
  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        const result = await getPartsData(vehicleId);

        if (mounted) {
          if ('error' in result) {
            setError(result.error);
          } else {
            setSlots(result.slots);
            setInventory(result.inventory);
            setVehicle(result.vehicle);
          }
        }
      } catch (err) {
        console.error(err);
        if (mounted) setError('Failed to load parts diagram');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();

    return () => { mounted = false; };
  }, [vehicleId]);

  // Handler for Add Part
  const handleAddPart = (slot: PartSlot) => {
    setSelectedSlotForAdd(slot);
    setIsModalOpen(true);
  };

  // Handler for View Details
  const handleViewDetails = (slot: PartSlot) => {
    setSelectedSlotForDetail(slot);
    setIsDetailModalOpen(true);
  };

  // Handler for successful part addition - refresh data
  const handlePartAdded = async () => {
    try {
      setLoading(true);
      const result = await getPartsData(vehicleId);
      if ('error' in result) {
        setError(result.error);
      } else {
        setSlots(result.slots);
        setInventory(result.inventory);
        setVehicle(result.vehicle);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to refresh parts data');
    } finally {
      setLoading(false);
    }
  };

  // --- Requirement 2: 3-Zone Logic ---

  // Pre-process inventory to attach hardware and filter visibility
  const processedInventory = React.useMemo(() => {
    // 1. Separate Hardware
    const hardwareItems = inventory.filter(i => i.visibility === 'hardware');
    const mainItems = inventory.filter(i => i.visibility !== 'hardware' && i.visibility !== 'history_only');

    // 2. Map hardware to parents
    const hardwareMap = new Map<string, VehicleInstalledComponent[]>();
    hardwareItems.forEach(hw => {
      if (hw.parent_id) {
        const current = hardwareMap.get(hw.parent_id) || [];
        hardwareMap.set(hw.parent_id, [...current, hw]);
      }
    });

    // 3. Attach to parents
    return mainItems.map(item => ({
      ...item,
      hardware: hardwareMap.get(item.id) || []
    }));
  }, [inventory]);

  // Build a map of inventory_source_id → kit name for lineage display
  const kitNameMap = React.useMemo(() => {
    const map = new Map<string, string>();
    // Kit records have visibility='history_only' — look them up by ID
    inventory.forEach(item => {
      if (item.visibility === 'history_only') {
        map.set(item.id, item.name);
      }
    });
    return map;
  }, [inventory]);

  // Zone 1: Installed
  const zone1Installed = processedInventory.filter(item => {
    if (item.status !== 'installed') return false;
    // Check category matches active category
    return item.category === activeCategory || item.master_part?.category === activeCategory;
  });

  // Zone 2: Blueprint (Standard Components)
  // Logic: Get standard items for category, filtered by NOT matching installed items partially
  const standardItems = STANDARD_COMPONENTS[activeCategory] || [];

  // Create "Blueprint Slots" from standard items that are NOT installed
  const zone2Blueprint = standardItems.filter(stdName => {
    // Check if any installed item fuzzy matches this standard name
    return !zone1Installed.some(item => {
      const installedName = item.name || item.master_part?.name || '';
      return installedName.toLowerCase().includes(stdName.toLowerCase());
    });
  }).map(stdName => ({
    // Create a virtual/placeholder slot for the UI
    id: `blueprint-${stdName}`,
    name: stdName,
    category: activeCategory,
    default_lifespan_miles: null,
    default_lifespan_months: null,
    installedComponent: undefined
  } as PartSlot));


  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">
            Viewing: {CATEGORIES.find(c => c.id === activeCategory)?.label}
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Manage and track your vehicle's {CATEGORIES.find(c => c.id === activeCategory)?.label.toLowerCase()} components
          </p>
        </div>

        <div className="w-full md:w-auto min-w-[200px]">
          <Select
            value={activeCategory}
            onValueChange={(val) => setActiveCategory(val as PartCategory)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bottom: Component Grid (3-Zone) */}
      <section className="space-y-8">

        {/* Zone 1: Installed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="w-2 h-6 bg-success rounded-full" />
              Installed Components
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">{zone1Installed.length} items</span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1"
                onClick={() => {
                  setSelectedSlotForAdd(null);
                  setIsModalOpen(true);
                }}
              >
                <Plus className="h-3 w-3" />
                Add Part
              </Button>
            </div>
          </div>

          {zone1Installed.length === 0 ? (
            <div className="p-8 text-center bg-muted/30 rounded-lg border border-dashed text-muted-foreground">
              No installed components in this category.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {zone1Installed.map((item) => (
                <PartCard
                  key={item.id}
                  slot={{
                    id: item.category || 'unknown-slot',
                    name: item.name,
                    category: activeCategory,
                    default_lifespan_miles: null,
                    default_lifespan_months: null,
                    installedComponent: item,
                  } as PartSlot}
                  currentOdometer={vehicle?.odometer || 0}
                  onAddPart={handleAddPart}
                  onViewDetails={handleViewDetails}
                  kitName={item.inventory_source_id ? kitNameMap.get(item.inventory_source_id) : undefined}
                />
              ))}
            </div>
          )}
        </div>

        {/* Zone 2: Blueprint */}
        {/* Zone 2: Blueprint (Collapsible) */}
        <div className="space-y-4">
          <div
            className="flex items-center justify-between border-b pb-2 cursor-pointer hover:bg-muted/10 transition-colors rounded-sm px-1 py-1"
            onClick={() => setIsBlueprintExpanded(!isBlueprintExpanded)}
          >
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="w-2 h-6 bg-info rounded-full" />
              Blueprint (Recommended)
              <span className="text-xs font-normal text-muted-foreground ml-2">
                {isBlueprintExpanded ? 'Hide' : 'Show'}
              </span>
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">{zone2Blueprint.length} items</span>
              {isBlueprintExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>

          {isBlueprintExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-300">
              {zone2Blueprint.map((slot) => (
                <PartCard
                  key={slot.id}
                  slot={slot}
                  currentOdometer={vehicle?.odometer || 0}
                  onAddPart={handleAddPart}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </div>



      </section>

      {/* Modals */}
      <AddPartModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        slot={selectedSlotForAdd}
        vehicleId={vehicleId}
        defaultCategory={activeCategory} // Pass active category
        onSuccess={handlePartAdded}
      />
      <ComponentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        slot={selectedSlotForDetail}
        vehicleId={vehicleId}
        currentOdometer={vehicle?.odometer || 0}
        onSuccess={handlePartAdded}
      />
    </div>
  );
}
