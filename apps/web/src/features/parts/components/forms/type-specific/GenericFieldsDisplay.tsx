import React from 'react';

interface GenericFieldsDisplayProps {
  specs: Record<string, any>;
}

export const GenericFieldsDisplay: React.FC<GenericFieldsDisplayProps> = ({ specs }) => {
  if (!specs || Object.keys(specs).length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
      {Object.entries(specs).map(([key, value]) => (
        <div key={key} className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </div>
          <div className="px-3 py-2 bg-muted/30 rounded-md text-sm font-medium">
            {String(value)}
          </div>
        </div>
      ))}
    </div>
  );
};
