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
      className={`h-full flex flex-col ${isInstalled && onViewDetails ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
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
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Health</span>
                <span className={
                  health?.status === 'Critical' ? 'text-red-500 font-bold' :
                  health?.status === 'Warning' ? 'text-yellow-500 font-bold' : 'text-green-500'
                }>
                  {health?.status}
                </span>
              </div>
              {/* Custom styled progress to apply semantic colors - replacing @repo/ui/progress */}
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full ${statusColor} transition-all duration-500`}
                  style={{ width: `${healthValue}%` }}
                />
              </div>
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
