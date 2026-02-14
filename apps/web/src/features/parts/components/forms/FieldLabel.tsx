import React from 'react';
import { Label } from '@repo/ui/label';
import { AlertTriangle } from 'lucide-react';

interface FieldLabelProps {
  htmlFor: string;
  children: React.ReactNode;
  showHazard?: boolean;
  hazardTooltip?: string;
}

export const FieldLabel: React.FC<FieldLabelProps> = ({ 
  htmlFor, 
  children, 
  showHazard = false,
  hazardTooltip = 'This field is missing crucial information'
}) => {
  return (
    <Label htmlFor={htmlFor} className="flex items-center gap-2">
      {children}
      {showHazard && (
        <span title={hazardTooltip}>
          <AlertTriangle className="h-3.5 w-3.5 text-warning" />
        </span>
      )}
    </Label>
  );
};
