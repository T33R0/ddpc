'use client';

import React, { useEffect, useState } from 'react';
import { CoupeWireframe } from '@/components/CoupeWireframe';
import { PartCard } from './components/PartCard';
import { AddPartModal } from './components/AddPartModal';
import { getPartsData } from './actions';
import { PartSlot, UserVehicle } from './types';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/alert';

// Mapping from Wireframe Zones to DB Categories
// Keys match CoupeWireframe events: 'Engine', 'Interior', 'Exterior', 'Braking', 'Suspension'
const ZONE_MAPPING: Record<string, string[]> = {
  'Engine': ['Engine', 'Drivetrain', 'Exhaust', 'Cooling'],
  'Interior': ['Interior', 'Electronics', 'Cabin'],
  'Exterior': ['Body', 'Exterior', 'Glass', 'Lighting'],
  'Braking': ['Brakes', 'Wheels', 'Tires'],
  'Suspension': ['Suspension', 'Steering', 'Chassis'],
};

interface PartsDiagramContainerProps {
  vehicleId: string;
}

export default function PartsDiagramContainer({ vehicleId }: PartsDiagramContainerProps) {
  // State
  const [selectedZone, setSelectedZone] = useState<string | null>('Engine'); // Default to Engine
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<PartSlot[]>([]);
  const [vehicle, setVehicle] = useState<UserVehicle | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlotForAdd, setSelectedSlotForAdd] = useState<PartSlot | null>(null);

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

  // Handler for Zone Click
  const handleZoneClick = (zone: string) => {
    setSelectedZone(zone);
  };

  // Handler for Add Part
  const handleAddPart = (slot: PartSlot) => {
    setSelectedSlotForAdd(slot);
    setIsModalOpen(true);
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
        setVehicle(result.vehicle);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to refresh parts data');
    } finally {
      setLoading(false);
    }
  };

  // Filter Slots based on Selected Zone
  const filteredSlots = slots.filter((slot) => {
    if (!selectedZone) return true; // Show all if no zone (optional behavior)

    // Check if the slot category matches the mapped categories for the zone
    const allowedCategories = ZONE_MAPPING[selectedZone] || [];
    // Case-insensitive check or partial matching if categories are loose
    return allowedCategories.some(c =>
        slot.category.toLowerCase() === c.toLowerCase()
    );
  });

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
      {/* Top: Wireframe */}
      <section className="bg-card/50 rounded-xl p-4 border shadow-sm">
        <h2 className="text-xl font-semibold text-center mb-4">Interactive Diagram</h2>
        <CoupeWireframe
          selectedZone={selectedZone}
          onZoneClick={handleZoneClick}
        />
        <p className="text-center text-sm text-muted-foreground mt-2">
          Select a zone to view components
        </p>
      </section>

      {/* Bottom: Component Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">
            {selectedZone ? `${selectedZone} Components` : 'All Components'}
          </h2>
          <span className="text-muted-foreground text-sm">
            {filteredSlots.length} items found
          </span>
        </div>

        {filteredSlots.length === 0 ? (
           <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/50">
             <p className="text-muted-foreground">No component slots defined for this zone.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSlots.map((slot) => (
              <PartCard
                key={slot.id}
                slot={slot}
                currentOdometer={vehicle?.odometer || 0}
                onAddPart={handleAddPart}
              />
            ))}
          </div>
        )}
      </section>

      {/* Modals */}
      <AddPartModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        slot={selectedSlotForAdd}
        vehicleId={vehicleId}
        onSuccess={handlePartAdded}
      />
    </div>
  );
}
