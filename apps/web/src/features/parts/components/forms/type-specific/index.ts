import React from 'react';
import { GenericFields } from './GenericFields';
import { TireFields } from './TireFields';
import { TireFieldsDisplay } from './TireFieldsDisplay';
import { GenericFieldsDisplay } from './GenericFieldsDisplay';

export interface TypeFieldsProps {
  data: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

export interface TypeFieldsDisplayProps {
  specs: Record<string, any>;
}

// Registry for editable form components
export const partTypeFieldsRegistry: Record<string, React.ComponentType<TypeFieldsProps>> = {
  'tires': TireFields,
  'wheels': GenericFields,
  'brakes': GenericFields,
  'suspension': GenericFields,
  'engine': GenericFields,
  'default': GenericFields,
};

// Registry for read-only display components
export const partTypeDisplayRegistry: Record<string, React.ComponentType<TypeFieldsDisplayProps>> = {
  'tires': TireFieldsDisplay,
  'wheels': GenericFieldsDisplay,
  'brakes': GenericFieldsDisplay,
  'suspension': GenericFieldsDisplay,
  'engine': GenericFieldsDisplay,
  'default': GenericFieldsDisplay,
};

export function getFieldsComponentForType(partType: string): React.ComponentType<TypeFieldsProps> {
  const normalizedType = partType?.toLowerCase() || 'default';
  if (partTypeFieldsRegistry[normalizedType]) {
    return partTypeFieldsRegistry[normalizedType];
  }
  if (normalizedType.includes('tire')) return partTypeFieldsRegistry['tires']!;
  return partTypeFieldsRegistry['default']!;
}

export function getDisplayComponentForType(partType: string): React.ComponentType<TypeFieldsDisplayProps> {
  const normalizedType = partType?.toLowerCase() || 'default';
  if (partTypeDisplayRegistry[normalizedType]) {
    return partTypeDisplayRegistry[normalizedType];
  }
  if (normalizedType.includes('tire')) return partTypeDisplayRegistry['tires']!;
  return partTypeDisplayRegistry['default']!;
}
