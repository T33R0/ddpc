
import React, { useEffect, useMemo, useState } from 'react';
import type { VehicleSummary, TrimVariant } from '@repo/types';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@repo/ui/dialog';
import { Button } from '@repo/ui/button';
import Link from 'next/link';
import { AuthModal } from '@/features/auth/AuthModal';

import { ImageWithTimeoutFallback } from '@/components/image-with-timeout-fallback';
import { addVehicleToGarage } from '@/actions/garage';

type VehicleDetailsModalProps = {
  summary: VehicleSummary;
  initialTrimId?: string;
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  canNavigatePrev?: boolean;
  canNavigateNext?: boolean;
  open?: boolean;
};

// Helper function to format specs with proper units
const formatSpec = (value: string | undefined | null, unit: string = ''): string => {
  if (!value || value === 'null' || value === 'undefined') return '—';
  return unit ? `${value}${unit}` : value;
};

// Calculate power-to-weight ratio
const calculatePowerToWeight = (hp: string | undefined, weight: string | undefined): string => {
  if (!hp || !weight) return '—';
  const hpNum = parseFloat(hp);
  const weightNum = parseFloat(weight);
  if (isNaN(hpNum) || isNaN(weightNum) || hpNum === 0) return '—';

  const lbPerHp = (weightNum / hpNum).toFixed(2);
  const hpPerTon = ((hpNum / weightNum) * 2000).toFixed(0);
  return `${lbPerHp} lb/hp (≈${hpPerTon} hp/ton)`;
};

// Calculate specific output
const calculateSpecificOutput = (hp: string | undefined, displacement: string | undefined): string => {
  if (!hp || !displacement) return '—';
  const hpNum = parseFloat(hp);
  const dispNum = parseFloat(displacement);
  if (isNaN(hpNum) || isNaN(dispNum) || dispNum === 0) return '—';

  const hpPerLiter = (hpNum / dispNum).toFixed(0);
  return `${hpPerLiter} hp/L`;
};

// Format engine configuration
const formatEngine = (trim: TrimVariant): string => {
  const parts: string[] = [];

  if (trim.engine_size_l) parts.push(`${trim.engine_size_l}L`);
  if (trim.cylinders) {
    const cyl = trim.cylinders;
    parts.push(cyl.includes('cylinder') ? cyl : `${cyl}-cyl`);
  }
  if (trim.engine_type) parts.push(trim.engine_type.toUpperCase());

  return parts.length > 0 ? parts.join(' ') : '—';
};

// Format fuel economy and range
const formatFuelEconomy = (trim: TrimVariant): string => {
  const parts: string[] = [];

  if (trim.epa_combined_mpg) {
    parts.push(`${trim.epa_combined_mpg} mpg`);

    if (trim.epa_city_highway_mpg) {
      parts.push(`(${trim.epa_city_highway_mpg.replace('/', '/')} city/hwy)`);
    }
  }

  if (trim.fuel_tank_capacity_gal) {
    parts.push(`• ${trim.fuel_tank_capacity_gal}-gal tank`);

    // Calculate range if we have mpg and tank size
    if (trim.epa_city_highway_mpg) {
      const mpgValues = trim.epa_city_highway_mpg.split('/').map(v => parseFloat(v));
      const city = mpgValues[0];
      const hwy = mpgValues[1];
      const tank = parseFloat(trim.fuel_tank_capacity_gal);
      if (city !== undefined && hwy !== undefined && !isNaN(city) && !isNaN(hwy) && !isNaN(tank)) {
        const cityRange = Math.round(city * tank);
        const hwyRange = Math.round(hwy * tank);
        parts.push(`• ${cityRange}–${hwyRange} mi range`);
      }
    }
  }

  return parts.length > 0 ? parts.join(' ') : '—';
};

const VehicleDetailsModal = ({
  summary,
  initialTrimId,
  onClose,
  onNavigate,
  canNavigatePrev = false,
  canNavigateNext = false,
  open = true
}: VehicleDetailsModalProps) => {
  const { user } = useAuth();
  const [selectedTrimId, setSelectedTrimId] = useState<string>(initialTrimId ?? summary.trims[0]?.id ?? '');
  const [isAddingToGarage, setIsAddingToGarage] = useState(false);
  const [isAddedToGarage, setIsAddedToGarage] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAdd, setPendingAdd] = useState(false);

  useEffect(() => {
    setSelectedTrimId(initialTrimId ?? summary.trims[0]?.id ?? '');
  }, [summary, initialTrimId]);

  // Group trims by name
  const groupedTrims = useMemo(() => {
    const groups: Record<string, TrimVariant[]> = {};
    summary.trims.forEach(trim => {
      // Use trim name as key, fallback to model if trim name is missing
      const key = trim.trim || trim.model;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(trim);
    });
    return groups;
  }, [summary]);

  const selectedTrim = useMemo<TrimVariant | null>(() => {
    return summary.trims.find((trim) => trim.id === selectedTrimId) ?? summary.trims[0] ?? null;
  }, [summary, selectedTrimId]);

  // Derive selected trim name from selectedTrim
  const selectedTrimName = useMemo(() => {
    if (!selectedTrim) return '';
    return selectedTrim.trim || selectedTrim.model;
  }, [selectedTrim]);

  // Get variants for the current trim name
  const currentTrimVariants = useMemo(() => {
    return groupedTrims[selectedTrimName] || [];
  }, [groupedTrims, selectedTrimName]);

  const handleTrimNameChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTrimName = event.target.value;
    const variants = groupedTrims[newTrimName];
    if (variants && variants.length > 0 && variants[0]) {
      // Auto-select the first variant in the group
      setSelectedTrimId(variants[0].id);
    }
  };

  const handleTrimVariantChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTrimId(event.target.value);
  };

  // Touch handlers for swipe navigation
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0]?.clientX ?? null);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0]?.clientX ?? null);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && canNavigateNext && onNavigate) {
      onNavigate('next');
    } else if (isRightSwipe && canNavigatePrev && onNavigate) {
      onNavigate('prev');
    }
  };

  const handleAddToGarage = React.useCallback(async () => {
    if (!selectedTrim) {
      toast.error('Select a trim before adding to your garage.');
      return;
    }

    if (!user) {
      setShowAuthModal(true);
      setPendingAdd(true);
      return;
    }
    setIsAddingToGarage(true);

    try {
      // Use Server Action directly
      const result = await addVehicleToGarage(selectedTrim.id);

      if (result.error) {
        throw new Error(result.error);
      }

      setIsAddedToGarage(true);
      toast.success('Vehicle successfully added to your garage!');

      // Redirect to vehicle page after a short delay if this was a pending add (meaning user just signed up/in)
      if (pendingAdd && result.vehicleId) {
        window.location.href = `/vehicle/${result.vehicleId}`;
        return;
      }

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error adding vehicle to garage:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add vehicle to garage');
    } finally {
      setIsAddingToGarage(false);
    }
  }, [selectedTrim, user, pendingAdd, onClose]);

  // Auto-trigger add to garage when user signs in if pending
  useEffect(() => {
    if (user && pendingAdd) {
      setPendingAdd(false);
      // Small timeout to ensure auth state is fully propagated
      setTimeout(() => {
        handleAddToGarage();
      }, 500);
    }
  }, [user, pendingAdd, handleAddToGarage]);

  if (!selectedTrim) {
    return null;
  }

  // Use the same image priority as the gallery card: heroImage first, then selected trim's image_url
  const primaryImageUrl = summary.heroImage || selectedTrim.image_url || "https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center";

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-5xl max-h-[85dvh] overflow-y-auto p-0"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Header */}
        <DialogHeader className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
          <DialogTitle className="text-2xl font-bold text-foreground text-left">
            {summary.year} {summary.make} {summary.model}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Vehicle details and specifications for {summary.year} {summary.make} {summary.model}
          </DialogDescription>
        </DialogHeader>

        {/* Side Navigation Arrows - Responsive positioning */}
        {canNavigatePrev && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate?.('prev');
            }}
            aria-label="Previous vehicle"
            className="fixed left-2 md:left-4 top-1/2 -translate-y-1/2 z-[60] p-2 md:p-4 bg-background/80 backdrop-blur-lg border border-border rounded-full hover:bg-muted transition-colors shadow-lg hidden md:flex"
          >
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-foreground" />
          </button>
        )}

        {canNavigateNext && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate?.('next');
            }}
            aria-label="Next vehicle"
            className="fixed right-2 md:right-4 top-1/2 -translate-y-1/2 z-[60] p-2 md:p-4 bg-background/80 backdrop-blur-lg border border-border rounded-full hover:bg-muted transition-colors shadow-lg hidden md:flex"
          >
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-foreground" />
          </button>
        )}

        {/* Content */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Image and Trim Selector */}
            <div className="space-y-4">
              <div className="w-full aspect-video overflow-hidden rounded-lg bg-muted/10 relative group">
                <ImageWithTimeoutFallback
                  src={primaryImageUrl}
                  fallbackSrc="/branding/fallback-logo.png"
                  alt={`${summary.make} ${summary.model}`}
                  className="w-full h-full object-cover"
                />

                {/* Mobile Navigation Arrows Overlay on Image */}
                <div className="absolute inset-0 flex items-center justify-between px-2 md:hidden z-20 pointer-events-none">
                  {canNavigatePrev ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate?.('prev');
                      }}
                      className="pointer-events-auto p-3 bg-black/60 text-white rounded-full backdrop-blur-md shadow-lg active:scale-95 transition-transform"
                      aria-label="Previous vehicle"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                  ) : <div />}

                  {canNavigateNext && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate?.('next');
                      }}
                      className="pointer-events-auto p-3 bg-black/60 text-white rounded-full backdrop-blur-md shadow-lg active:scale-95 transition-transform"
                      aria-label="Next vehicle"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  )}
                </div>
              </div>

              {/* Trim Selectors */}
              <div className="space-y-4">
                {/* Primary Trim Selector */}
                <div className="space-y-2">
                  <label htmlFor="trim-name-select" className="text-sm text-muted-foreground block">
                    Select Trim:
                  </label>
                  <select
                    id="trim-name-select"
                    value={selectedTrimName}
                    onChange={handleTrimNameChange}
                    className="max-w-xs flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {Object.keys(groupedTrims).map((trimName) => (
                      <option key={trimName} value={trimName} className="bg-background text-foreground">
                        {trimName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Secondary Configuration Selector (Conditional) */}
                {currentTrimVariants.length > 1 && (
                  <div className="space-y-2">
                    <label htmlFor="trim-variant-select" className="text-sm text-muted-foreground block">
                      Configuration:
                    </label>
                    <select
                      id="trim-variant-select"
                      value={selectedTrimId}
                      onChange={handleTrimVariantChange}
                      className="max-w-xs flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {currentTrimVariants.map((variant) => (
                        <option key={variant.id} value={variant.id} className="bg-background text-foreground">
                          {variant.trim_description || 'Standard'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Specifications */}
            <div className="space-y-4">
              {/* Vehicle Type */}
              {(selectedTrim.body_type || selectedTrim.drive_type) && (
                <div className="text-muted-foreground">
                  <span className="text-lg text-foreground">
                    {[selectedTrim.body_type, selectedTrim.drive_type].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}

              {/* Engine */}
              {selectedTrim.engine_size_l && (
                <div className="space-y-1">
                  <div className="text-muted-foreground text-sm">Engine:</div>
                  <div className="text-foreground">
                    {formatEngine(selectedTrim)}
                    {selectedTrim.fuel_type && ` • ${selectedTrim.fuel_type}`}
                  </div>
                </div>
              )}

              {/* Output */}
              {(selectedTrim.horsepower_hp || selectedTrim.torque_ft_lbs) && (
                <div className="space-y-1">
                  <div className="text-muted-foreground text-sm">Output:</div>
                  <div className="text-foreground">
                    {selectedTrim.horsepower_hp && (
                      <>
                        {selectedTrim.horsepower_hp} hp
                        {selectedTrim.horsepower_rpm && ` @ ${selectedTrim.horsepower_rpm} rpm`}
                      </>
                    )}
                    {selectedTrim.torque_ft_lbs && (
                      <>
                        {selectedTrim.horsepower_hp && ' • '}
                        {selectedTrim.torque_ft_lbs} lb-ft
                        {selectedTrim.torque_rpm && ` @ ${selectedTrim.torque_rpm} rpm`}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Transmission */}
              {selectedTrim.transmission && (
                <div className="space-y-1">
                  <div className="text-muted-foreground text-sm">Transmission:</div>
                  <div className="text-foreground">{selectedTrim.transmission}</div>
                </div>
              )}

              {/* Curb Weight */}
              {selectedTrim.curb_weight_lbs && (
                <div className="space-y-1">
                  <div className="text-muted-foreground text-sm">Curb Weight:</div>
                  <div className="text-foreground">{formatSpec(selectedTrim.curb_weight_lbs, ' lb')}</div>
                </div>
              )}

              {/* Power-to-Weight Ratio */}
              {selectedTrim.horsepower_hp && selectedTrim.curb_weight_lbs && (
                <div className="space-y-1">
                  <div className="text-muted-foreground text-sm">Power-to-Weight:</div>
                  <div className="text-foreground">
                    {calculatePowerToWeight(selectedTrim.horsepower_hp, selectedTrim.curb_weight_lbs)}
                    {' • '}
                    <span className="text-muted-foreground">Specific Output:</span>
                    {' '}
                    {calculateSpecificOutput(selectedTrim.horsepower_hp, selectedTrim.engine_size_l)}
                  </div>
                </div>
              )}

              {/* Suspension */}
              {selectedTrim.suspension && (
                <div className="space-y-1">
                  <div className="text-muted-foreground text-sm">Suspension:</div>
                  <div className="text-foreground">{selectedTrim.suspension}</div>
                </div>
              )}

              {/* Drivetrain */}
              {selectedTrim.drive_type && (
                <div className="space-y-1">
                  <div className="text-muted-foreground text-sm">Drivetrain:</div>
                  <div className="text-foreground">{selectedTrim.drive_type}</div>
                </div>
              )}

              {/* Fuel Economy/Range */}
              {selectedTrim.epa_combined_mpg && (
                <div className="space-y-1">
                  <div className="text-muted-foreground text-sm">Fuel Economy/Range:</div>
                  <div className="text-foreground">{formatFuelEconomy(selectedTrim)}</div>
                </div>
              )}

              {/* Ground Clearance */}
              {selectedTrim.ground_clearance_in && (
                <div className="space-y-1">
                  <div className="text-muted-foreground text-sm">Ground Clearance:</div>
                  <div className="text-foreground">{formatSpec(selectedTrim.ground_clearance_in, ' in.')}</div>
                </div>
              )}

              {/* Towing Capacity (if available) */}
              {selectedTrim.max_towing_capacity_lbs && selectedTrim.max_towing_capacity_lbs !== '0' && (
                <div className="space-y-1">
                  <div className="text-muted-foreground text-sm">Max Towing Capacity:</div>
                  <div className="text-foreground">{formatSpec(selectedTrim.max_towing_capacity_lbs, ' lb')}</div>
                </div>
              )}

              {/* Seating */}
              {selectedTrim.total_seating && (
                <div className="space-y-1">
                  <div className="text-muted-foreground text-sm">Seating:</div>
                  <div className="text-foreground">{selectedTrim.total_seating} passengers</div>
                </div>
              )}

              {/* Cargo Capacity */}
              {selectedTrim.cargo_capacity_cuft && (
                <div className="space-y-1">
                  <div className="text-muted-foreground text-sm">Cargo Capacity:</div>
                  <div className="text-foreground">
                    {formatSpec(selectedTrim.cargo_capacity_cuft, ' cu ft')}
                    {selectedTrim.max_cargo_capacity_cuft &&
                      ` (${formatSpec(selectedTrim.max_cargo_capacity_cuft, ' cu ft')} max)`
                    }
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <DialogFooter className="pt-6 sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 -mx-6 px-6 border-t border-border mt-auto">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center w-full">
              <Button
                onClick={handleAddToGarage}
                disabled={isAddingToGarage || isAddedToGarage}
                className={`w-full sm:w-auto min-w-[200px] ${isAddedToGarage ? 'bg-green-600 hover:bg-green-700' : ''}`}
              >
                {isAddingToGarage
                  ? 'Adding to Garage...'
                  : isAddedToGarage
                    ? '✓ Added to Garage'
                    : 'Add to Garage'
                }
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full sm:w-auto min-w-[200px]"
              >
                <Link
                  href={`/details/${summary.year}/${encodeURIComponent(summary.make)}/${encodeURIComponent(summary.model)}?trim=${selectedTrimId}`}
                >
                  More Details
                </Link>
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent >

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Add to Your Garage"
        description="Sign up or sign in to add this vehicle to your garage and track its history."
        onSuccess={() => setShowAuthModal(false)}
      />
    </Dialog >
  );
};

export default VehicleDetailsModal;
