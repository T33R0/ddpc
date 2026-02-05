import React from 'react';
import { Label } from '@repo/ui/label';
import { TireSpecificData } from '../../../types';

interface TireFieldsDisplayProps {
  specs: Partial<TireSpecificData>;
}

export const TireFieldsDisplay: React.FC<TireFieldsDisplayProps> = ({ specs }) => {
  // Format tire size for display
  const formatTireSize = (width?: number, aspectRatio?: number, diameter?: number) => {
    if (!width || !aspectRatio || !diameter) return 'N/A';
    return `${width}/${aspectRatio}R${diameter}`;
  };

  const frontSize = formatTireSize(specs.width, specs.aspectRatio, specs.diameter);
  const rearSize = specs.isStaggered 
    ? formatTireSize(specs.rearWidth, specs.rearAspectRatio, specs.rearDiameter)
    : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tire Size */}
        <div className="space-y-2">
          <Label>Tire Size (Front)</Label>
          <div className="px-3 py-2 bg-muted/30 rounded-md text-sm font-medium">
            {frontSize}
          </div>
        </div>

        {/* Staggered Rear Size */}
        {specs.isStaggered && rearSize && (
          <div className="space-y-2">
            <Label>Tire Size (Rear)</Label>
            <div className="px-3 py-2 bg-muted/30 rounded-md text-sm font-medium">
              {rearSize}
            </div>
          </div>
        )}

        {/* Speed Rating */}
        {specs.speedRating && (
          <div className="space-y-2">
            <Label>Speed Rating</Label>
            <div className="px-3 py-2 bg-muted/30 rounded-md text-sm font-medium">
              {specs.speedRating}
            </div>
          </div>
        )}

        {/* Load Index */}
        {specs.loadIndex !== undefined && (
          <div className="space-y-2">
            <Label>Load Index</Label>
            <div className="px-3 py-2 bg-muted/30 rounded-md text-sm font-medium">
              {specs.loadIndex}
            </div>
          </div>
        )}

        {/* DOT Date */}
        {specs.dotDateCode && (
          <div className="space-y-2">
            <Label>DOT Date Code</Label>
            <div className="px-3 py-2 bg-muted/30 rounded-md text-sm font-medium">
              {specs.dotDateCode}
            </div>
          </div>
        )}

        {/* Tread Depth at Install */}
        {specs.treadDepthAtInstall !== undefined && (
          <div className="space-y-2">
            <Label>Tread Depth at Install</Label>
            <div className="px-3 py-2 bg-muted/30 rounded-md text-sm font-medium">
              {specs.treadDepthAtInstall}/32"
            </div>
          </div>
        )}

        {/* Position */}
        {specs.position && (
          <div className="space-y-2">
            <Label>Position</Label>
            <div className="px-3 py-2 bg-muted/30 rounded-md text-sm font-medium capitalize">
              {specs.position}
            </div>
          </div>
        )}
      </div>

      {/* Staggered Setup Badge */}
      {specs.isStaggered && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="px-2 py-1 bg-primary/10 text-primary rounded-md font-medium">
            Staggered Setup
          </div>
        </div>
      )}
    </div>
  );
};
