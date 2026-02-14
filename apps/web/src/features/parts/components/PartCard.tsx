'use client';

import { Badge } from '@repo/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { PlusCircle, ShoppingCart, AlertTriangle } from 'lucide-react';
import { PartSlot } from '../types';
import { calculateHealth, HealthStatus, getUnknownReasonMessage } from '../lib/health';
import { format } from 'date-fns';

interface PartCardProps {
  slot: PartSlot;
  currentOdometer: number;
  onAddPart: (slot: PartSlot) => void;
  onViewDetails?: (slot: PartSlot) => void;
  kitName?: string; // Name of the parent kit if this part came from a kit
}

export const PartCard = ({ slot, currentOdometer, onAddPart, onViewDetails, kitName }: PartCardProps) => {
  const isInstalled = !!slot.installedComponent;

  // Calculate health if installed
  const health = isInstalled && slot.installedComponent
    ? calculateHealth(slot.installedComponent, slot, currentOdometer)
    : null;

  // Color mapping for health bar
  const getHealthColor = (status: HealthStatus) => {
    switch (status) {
      case 'Good': return 'bg-success';
      case 'Warning': return 'bg-warning';
      case 'Critical': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const statusColor = health ? getHealthColor(health.status) : '';

  // Inverse percentage for "Health Remaining" visual (100% - used%)
  // Ensure we don't show negative health
  const healthValue = health ? Math.max(0, 100 - health.percentageUsed) : 0;

  return (
    <Card
      className={`h-full flex flex-col
        ${isInstalled && onViewDetails ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
        ${slot.installedComponent?.status === 'planned' ? 'border-dashed border-info/30 bg-info/5' : ''}
      `}
      onClick={isInstalled && onViewDetails ? () => onViewDetails(slot) : undefined}
    >
      <CardHeader className="pb-2 space-y-1">
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {slot.name}
          </CardTitle>
          {isInstalled && slot.installedComponent && (
            (!slot.installedComponent.installed_at || !slot.installedComponent.install_miles || (slot.installedComponent.purchase_price === null && !slot.installedComponent.specs?.acquisition_type)) && (
              <div title="Missing information (Date, Miles, or Cost)">
                <AlertTriangle className="h-4 w-4 text-warning" />
              </div>
            )
          )}
        </div>
        {isInstalled && slot.installedComponent && (
          <div className="flex flex-wrap gap-2">
            {slot.category && (
              <Badge variant="secondary" className="px-2 py-0.5 rounded-full text-[10px] font-medium capitalize bg-secondary text-secondary-foreground hover:bg-secondary/80">
                {slot.category.replace('_', ' ')}
              </Badge>
            )}
            {/* Variant Badge */}
            {/* @ts-ignore - variant property might be missing on type for now, blindly adding as requested */}
            {slot.installedComponent.variant && (
              <Badge variant="secondary" className="px-2 py-0.5 rounded-full text-[10px] font-medium capitalize bg-secondary text-secondary-foreground hover:bg-secondary/80">
                {slot.installedComponent.variant}
              </Badge>
            )}
            {slot.installedComponent.status === 'wishlist' && (
              <Badge variant="outline" className="text-[10px] px-1.5 border-dashed border-primary/50 text-muted-foreground rounded-full">
                Wishlist
              </Badge>
            )}
          </div>
        )}
        {/* Kit Lineage Indicator */}
        {kitName && (
          <p className="text-[10px] text-muted-foreground mt-1">
            Part of: <span className="font-medium text-foreground">{kitName}</span>
          </p>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4">
        {isInstalled && slot.installedComponent ? (
          <>
            <div className="flex-1 space-y-3">
              {/* Only show specific name if it differs significantly from the slot name (case-insensitive check) */}
              {slot.installedComponent.name && slot.installedComponent.name.toLowerCase() !== slot.name.toLowerCase() && (
                <h3 className="font-semibold text-base truncate" title={slot.installedComponent.name}>
                  {slot.installedComponent.name}
                </h3>
              )}

              <div className="flex flex-col gap-1 text-xs text-muted-foreground min-h-[4.5em]">
                <div className="flex items-center justify-between">
                  <span>Part Number:</span>
                  <span className="font-mono font-medium text-foreground">{slot.installedComponent.part_number || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Installed Date:</span>
                  <span className="font-medium text-foreground">
                    {slot.installedComponent.installed_at ? format(new Date(slot.installedComponent.installed_at), 'MMM d, yyyy') : '-'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Installed Miles:</span>
                  <span className="font-medium text-foreground">
                    {slot.installedComponent.install_miles ? `${slot.installedComponent.install_miles.toLocaleString()} mi` : '-'}
                  </span>
                </div>
              </div>


              {/* Display Specs */}
              {slot.installedComponent.specs && Object.keys(slot.installedComponent.specs).length > 0 && (() => {
                const specs = slot.installedComponent.specs;
                const category = slot.installedComponent.category || slot.category;
                
                // Special handling for tires - show formatted tire sizes
                if (category === 'wheels_tires' && specs.width && specs.aspectRatio && specs.diameter) {
                  const frontSize = `${specs.width}/${specs.aspectRatio}R${specs.diameter}`;
                  const rearSize = specs.isStaggered && specs.rearWidth && specs.rearAspectRatio && specs.rearDiameter
                    ? `${specs.rearWidth}/${specs.rearAspectRatio}R${specs.rearDiameter}`
                    : null;
                  
                  return (
                    <div className={`mt-2 mb-2 p-2 bg-muted/30 rounded text-xs ${rearSize ? 'grid grid-cols-2 gap-2' : ''}`}>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground uppercase text-[10px]">Tire Size (Front)</span>
                        <span className="font-medium">{frontSize}</span>
                      </div>
                      {rearSize && (
                        <div className="flex flex-col">
                          <span className="text-muted-foreground uppercase text-[10px]">Tire Size (Rear)</span>
                          <span className="font-medium">{rearSize}</span>
                        </div>
                      )}
                    </div>
                  );
                }
                
                // Acquisition Type Badge (if cost is 0 or null)
                const acquisitionType = slot.installedComponent.specs?.acquisition_type;
                if ((slot.installedComponent.purchase_price === 0 || !slot.installedComponent.purchase_price) && acquisitionType) {
                  return (
                     <div className="mt-2 mb-2 p-2 bg-muted/30 rounded text-xs">
                        <div className="flex flex-col">
                           <span className="text-muted-foreground uppercase text-[10px]">Cost</span>
                           <div className="flex items-center gap-2">
                             <span className="font-mono font-medium">$0.00</span>
                             <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 uppercase bg-primary/10 text-primary border-primary/20">
                                {acquisitionType}
                             </Badge>
                           </div>
                        </div>
                     </div>
                  )
                }

                // Generic display for other part types
                return (
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 mb-2 p-2 bg-muted/30 rounded text-xs">
                    {/* Display Cost if not 0 or if 0 and explicit */}
                    {(slot.installedComponent.purchase_price !== null && slot.installedComponent.purchase_price !== undefined) && (
                         <div className="flex flex-col">
                           <span className="text-muted-foreground uppercase text-[10px]">Cost</span>
                           <span className="font-mono font-medium truncate">
                             ${slot.installedComponent.purchase_price.toFixed(2)}
                           </span>
                         </div>
                    )}
                    
                    {Object.entries(specs).map(([key, val]) => {
                      if (key === 'acquisition_type') return null; // Handled above
                      
                      // Try to find matching field definition for nice label/unit
                      const fieldDef = slot.spec_schema?.fields?.find((f: any) => f.key === key);
                      const labels = fieldDef?.label || key;
                      const displayVal = val;
                      const unit = fieldDef?.unit ? ` ${fieldDef.unit}` : '';

                      return (
                        <div key={key} className="flex flex-col">
                          <span className="text-muted-foreground uppercase text-[10px]">{labels}</span>
                          <span className="font-medium truncate" title={`${displayVal}${unit}`}>
                            {displayVal}{unit}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Display Attached Hardware */}
              {slot.installedComponent.hardware && slot.installedComponent.hardware.length > 0 && (
                <div className="mt-2 space-y-1 border-t pt-2">
                  <span className="text-[10px] uppercase text-muted-foreground font-semibold">Attached Hardware</span>
                  <div className="flex flex-wrap gap-1">
                    {slot.installedComponent.hardware.map(hw => (
                      <Badge key={hw.id} variant="outline" className="text-[10px] px-1.5 py-0 h-auto font-normal text-muted-foreground bg-muted/20">
                        {hw.quantity > 1 ? `${hw.quantity}x ` : ''}{hw.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1 min-h-[2rem]">
              <div className="flex justify-between text-xs items-end">
                <span className="font-semibold text-muted-foreground">Health</span>
                <span className={
                  slot.installedComponent.status === 'planned' ? 'text-info font-bold' :
                    health?.status === 'Critical' ? 'text-destructive font-bold' :
                      health?.status === 'Warning' ? 'text-warning font-bold' :
                        health?.status === 'Unknown' ? 'text-muted-foreground' : 'text-success'
                }>
                  {slot.installedComponent.status === 'planned' ? 'Planned' : health?.status}
                </span>
              </div>
              {/* Unknown reason hint */}
              {slot.installedComponent.status !== 'planned' && health?.status === 'Unknown' && (
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {getUnknownReasonMessage(health.unknownReason)}
                </p>
              )}

              {slot.installedComponent.status !== 'planned' && health?.status !== 'Unknown' && (
                health?.mileage && health?.time ? (
                  // Dual Bars
                  <div className="space-y-2 mt-1">
                    {/* Mileage Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Mileage</span>
                        <span>{Math.round(health.mileage.remaining).toLocaleString()} mi left</span>
                      </div>
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${getHealthColor(health.mileage.percentage > 90 ? 'Critical' : health.mileage.percentage > 70 ? 'Warning' : 'Good')}`}
                          style={{ width: `${Math.max(0, 100 - health.mileage.percentage)}%` }}
                          title={`Used: ${health.mileage.percentage.toFixed(1)}%`}
                        />
                      </div>
                    </div>

                    {/* Time Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Time</span>
                        <span>{Math.round(health.time.remaining)} mo left</span>
                      </div>
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${getHealthColor(health.time.percentage > 90 ? 'Critical' : health.time.percentage > 70 ? 'Warning' : 'Good')}`}
                          style={{ width: `${Math.max(0, 100 - health.time.percentage)}%` }}
                          title={`Used: ${health.time.percentage.toFixed(1)}%`}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  // Single Bar (Legacy/Fallback)
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{health?.mileage ? 'Mileage' : health?.time ? 'Time' : 'Usage'}</span>
                      <span>
                        {health?.mileage ? `${Math.round(health.mileage.remaining).toLocaleString()} mi left` :
                          health?.time ? `${Math.round(health.time.remaining)} mo left` : ''}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${statusColor} transition-all duration-500`}
                        style={{ width: `${healthValue}%` }}
                        title={`Remaining: ${healthValue.toFixed(1)}%`}
                      />
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="flex gap-2 mt-auto">

              {onViewDetails && (
                <Button
                  variant="default"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(slot);
                  }}
                >
                  View Details
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-muted rounded-md min-h-[120px]">
            <p className="text-muted-foreground mb-4 text-sm">Empty Slot</p>
            <Button size="sm" onClick={() => onAddPart(slot)} className="gap-2">
              <PlusCircle className="w-4 h-4" />
              Add Part
            </Button>
          </div>
        )}
      </CardContent>
    </Card >
  );
};
