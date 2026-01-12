/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import type { VehicleSummary, TrimVariant } from '@repo/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal, ModalContent, ModalTitle, ModalDescription, ModalHeader } from '@repo/ui/modal';

// Simple image component that matches the gallery card behavior
type ImageWithTimeoutFallbackProps = {
  src: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
  timeout?: number;
};

function ImageWithTimeoutFallback({
  src,
  fallbackSrc,
  alt,
  className,
  timeout = 3000
}: ImageWithTimeoutFallbackProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!imageLoaded) {
        setShowFallback(true);
      }
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout, imageLoaded]);

  if (showFallback) {
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        className={className}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onLoad={() => setImageLoaded(true)}
      onError={() => setShowFallback(true)}
    />
  );
}

type CommunityVehicleDetailsModalProps = {
  summary: VehicleSummary;
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  canNavigatePrev?: boolean;
  canNavigateNext?: boolean;
  open?: boolean;
};

// Helper function to format specs with proper units
const formatSpec = (value: string | undefined | null, unit: string = ''): string => {
  if (!value || value === 'null' || value === 'undefined') return '—';
  return unit ? `${value}${unit} ` : value;
};

// Calculate power-to-weight ratio
const calculatePowerToWeight = (hp: string | undefined, weight: string | undefined): string => {
  if (!hp || !weight) return '—';
  const hpNum = parseFloat(hp);
  const weightNum = parseFloat(weight);
  if (isNaN(hpNum) || isNaN(weightNum) || hpNum === 0) return '—';

  const lbPerHp = (weightNum / hpNum).toFixed(2);
  const hpPerTon = ((hpNum / weightNum) * 2000).toFixed(0);
  return `${lbPerHp} lb / hp(≈${hpPerTon} hp / ton)`;
};

// Calculate specific output
const calculateSpecificOutput = (hp: string | undefined, displacement: string | undefined): string => {
  if (!hp || !displacement) return '—';
  const hpNum = parseFloat(hp);
  const dispNum = parseFloat(displacement);
  if (isNaN(hpNum) || isNaN(dispNum) || dispNum === 0) return '—';

  const hpPerLiter = (hpNum / dispNum).toFixed(0);
  return `${hpPerLiter} hp / L`;
};

// Format engine configuration
const formatEngine = (trim: TrimVariant): string => {
  const parts: string[] = [];

  if (trim.engine_size_l) parts.push(`${trim.engine_size_l} L`);
  if (trim.cylinders) {
    const cyl = trim.cylinders;
    parts.push(cyl.includes('cylinder') ? cyl : `${cyl} -cyl`);
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
      parts.push(`(${trim.epa_city_highway_mpg.replace('/', '/')} city / hwy)`);
    }
  }

  if (trim.fuel_tank_capacity_gal) {
    parts.push(`• ${trim.fuel_tank_capacity_gal} -gal tank`);

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

const CommunityVehicleDetailsModal = ({
  summary,
  onClose,
  onNavigate,
  canNavigatePrev = false,
  canNavigateNext = false,
  open = true
}: CommunityVehicleDetailsModalProps) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const selectedTrim = summary.trims[0] ?? null;

  if (!selectedTrim) {
    return null;
  }

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

  // Prioritize user uploaded image, then stock photo
  const primaryImageUrl = selectedTrim.vehicle_image || summary.heroImage || "https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center";

  // Format YMMT (Year Make Model Trim)
  const ymmt = `${summary.year} ${summary.make} ${summary.model} ${selectedTrim.trim || ''} `.trim();

  return (
    <Modal open={open} onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        className="sm:max-w-5xl max-h-[90vh] overflow-y-auto p-0"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Header */}
        <ModalHeader className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border z-10">
          <ModalTitle className="text-2xl font-bold text-foreground text-left">
            {ymmt}
          </ModalTitle>
          <ModalDescription className="sr-only">
            Vehicle details and specifications for {ymmt}
          </ModalDescription>
        </ModalHeader>

        {/* Side Navigation Arrows - Fixed positioning */}
        {canNavigatePrev && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate?.('prev');
            }}
            aria-label="Previous vehicle"
            className="fixed left-4 top-1/2 -translate-y-1/2 z-[60] p-4 bg-background/80 backdrop-blur-lg border border-border rounded-full hover:bg-muted transition-colors shadow-lg"
          >
            <ChevronLeft className="w-8 h-8 text-foreground" />
          </button>
        )}

        {canNavigateNext && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate?.('next');
            }}
            aria-label="Next vehicle"
            className="fixed right-4 top-1/2 -translate-y-1/2 z-[60] p-4 bg-background/80 backdrop-blur-lg border border-border rounded-full hover:bg-muted transition-colors shadow-lg"
          >
            <ChevronRight className="w-8 h-8 text-foreground" />
          </button>
        )}

        {/* Content */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Image */}
            <div className="space-y-4">
              <div className="w-full aspect-video overflow-hidden rounded-lg bg-muted/10">
                <ImageWithTimeoutFallback
                  src={primaryImageUrl}
                  fallbackSrc="/branding/fallback-logo.png"
                  alt={ymmt}
                  className="w-full h-full object-cover"
                />
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
                    {selectedTrim.fuel_type && ` • ${selectedTrim.fuel_type} `}
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
                        {selectedTrim.horsepower_rpm && ` @${selectedTrim.horsepower_rpm} rpm`}
                      </>
                    )}
                    {selectedTrim.torque_ft_lbs && (
                      <>
                        {selectedTrim.horsepower_hp && ' • '}
                        {selectedTrim.torque_ft_lbs} lb-ft
                        {selectedTrim.torque_rpm && ` @${selectedTrim.torque_rpm} rpm`}
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
        </div>
      </ModalContent>
    </Modal>
  );
};

export default CommunityVehicleDetailsModal;
