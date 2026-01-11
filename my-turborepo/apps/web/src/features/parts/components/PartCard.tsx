'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { PlusCircle, ShoppingCart } from 'lucide-react';
import { PartSlot } from '../types';
import { calculateHealth, HealthStatus } from '../lib/health';

interface PartCardProps {
  slot: PartSlot;
  currentOdometer: number;
  onAddPart: (slot: PartSlot) => void;
  onViewDetails?: (slot: PartSlot) => void;
}

export const PartCard = ({ slot, currentOdometer, onAddPart, onViewDetails }: PartCardProps) => {
  const isInstalled = !!slot.installedComponent;

  // Calculate health if installed
  const health = isInstalled && slot.installedComponent
    ? calculateHealth(slot.installedComponent, slot, currentOdometer)
    : null;

  // Color mapping for health bar
  const getHealthColor = (status: HealthStatus) => {
    switch (status) {
      case 'Good': return 'bg-green-500';
      case 'Warning': return 'bg-yellow-500';
      case 'Critical': return 'bg-red-500';
      default: return 'bg-gray-500';
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
        ${slot.installedComponent?.status === 'planned' ? 'border-dashed border-blue-200 bg-blue-50/10' : ''}
      `}
      onClick={isInstalled && onViewDetails ? () => onViewDetails(slot) : undefined}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {slot.name}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4">
        {isInstalled && slot.installedComponent && slot.installedComponent.master_part ? (
          <>
            <div className="flex-1">
              <h3 className="font-semibold text-lg truncate" title={slot.installedComponent.master_part.name}>
                {slot.installedComponent.master_part.name}
              </h3>
              <p className="text-sm text-muted-foreground font-mono">
                {slot.installedComponent.master_part.part_number}
              </p>

              {/* Display Specs */}
              {slot.installedComponent.specs && Object.keys(slot.installedComponent.specs).length > 0 && (
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 mb-2 p-2 bg-muted/30 rounded text-xs">
                  {Object.entries(slot.installedComponent.specs).map(([key, val]) => {
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
              )}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Health</span>
                <span className={
                  slot.installedComponent.status === 'planned' ? 'text-blue-500 font-bold' :
                    health?.status === 'Critical' ? 'text-red-500 font-bold' :
                      health?.status === 'Warning' ? 'text-yellow-500 font-bold' : 'text-green-500'
                }>
                  {slot.installedComponent.status === 'planned' ? 'Planned' : health?.status}
                </span>
              </div>
              {/* Custom styled progress to apply semantic colors - replacing @repo/ui/progress */}
              {slot.installedComponent.status !== 'planned' && (
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full ${statusColor} transition-all duration-500`}
                    style={{ width: `${healthValue}%` }}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-auto">
              {slot.installedComponent.master_part.vendor_link && (
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <a
                    href={slot.installedComponent.master_part.vendor_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Buy
                  </a>
                </Button>
              )}
              {onViewDetails && (
                <Button
                  variant="default"
                  className={slot.installedComponent.master_part.vendor_link ? "flex-1" : "w-full"}
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
    </Card>
  );
};
