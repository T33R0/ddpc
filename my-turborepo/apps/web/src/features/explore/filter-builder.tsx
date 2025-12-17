'use client';

import React from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { DropdownMenu } from '@repo/ui/dropdown-menu';
import type { SupabaseFilter, FilterOptions, FilterOperator } from './types';

interface FilterBuilderProps {
  filters: SupabaseFilter[];
  onChange: (filters: SupabaseFilter[]) => void;
  options: FilterOptions;
}

const COLUMNS = [
  { label: 'Year', value: 'year', type: 'numeric' },
  { label: 'Make', value: 'make', type: 'text', optionsKey: 'makes' },
  { label: 'Model', value: 'model', type: 'text', optionsKey: 'models' },
  { label: 'Trim', value: 'trim', type: 'text' },
  { label: 'Drivetrain', value: 'drive_type', type: 'text', optionsKey: 'drivetrains' },
  { label: 'Body Type', value: 'body_type', type: 'text', optionsKey: 'bodyTypes' },
  { label: 'Doors', value: 'doors', type: 'numeric' },
  { label: 'Seats', value: 'total_seating', type: 'numeric' },
  { label: 'Cylinders', value: 'cylinders', type: 'numeric' }, // Treat as numeric for > <, though "V6" exists in raw data
  { label: 'Horsepower', value: 'horsepower_hp', type: 'numeric' },
  { label: 'Torque', value: 'torque_ft_lbs', type: 'numeric' },
  { label: 'Length (in)', value: 'length_in', type: 'numeric' },
  { label: 'Width (in)', value: 'width_in', type: 'numeric' },
  { label: 'Height (in)', value: 'height_in', type: 'numeric' },
  { label: 'Country', value: 'country_of_origin', type: 'text', optionsKey: 'countries' },
] as const;

const OPERATORS_TEXT: { label: string; value: FilterOperator }[] = [
  { label: 'Equals', value: 'eq' },
  { label: 'Not Equals', value: 'neq' },
  { label: 'Includes', value: 'ilike' },
];

const OPERATORS_NUMERIC: { label: string; value: FilterOperator }[] = [
  { label: 'Equals', value: 'eq' },
  { label: 'Not Equals', value: 'neq' },
  { label: 'Greater Than', value: 'gt' },
  { label: 'Less Than', value: 'lt' },
];

export function FilterBuilder({ filters, onChange, options }: FilterBuilderProps) {
  const addFilter = () => {
    const newFilter: SupabaseFilter = {
      id: crypto.randomUUID(),
      column: 'make',
      operator: 'eq',
      value: '',
    };
    onChange([...filters, newFilter]);
  };

  const removeFilter = (id: string) => {
    onChange(filters.filter((f) => f.id !== id));
  };

  const updateFilter = (id: string, updates: Partial<SupabaseFilter>) => {
    onChange(
      filters.map((f) => {
        if (f.id !== id) return f;
        const updated = { ...f, ...updates };

        // Reset value if column changes to prevent type mismatch (e.g. text value in numeric field)
        if (updates.column && updates.column !== f.column) {
          updated.value = '';
          // Reset operator to default for new type
          const colDef = COLUMNS.find(c => c.value === updates.column);
          updated.operator = colDef?.type === 'numeric' ? 'eq' : 'eq';
        }

        return updated;
      })
    );
  };

  const getOperators = (columnValue: string) => {
    const col = COLUMNS.find((c) => c.value === columnValue);
    return col?.type === 'numeric' ? OPERATORS_NUMERIC : OPERATORS_TEXT;
  };

  const getValueOptions = (columnValue: string) => {
    const col = COLUMNS.find((c) => c.value === columnValue);
    if (!col || !col.optionsKey) return null;

    // @ts-ignore - Dynamic access to options
    const rawOptions = options[col.optionsKey];

    if (columnValue === 'model') {
      // Special handling for models to show Make
      return rawOptions.map((m: { make: string; model: string }) => ({
        label: `${m.make} ${m.model}`,
        value: m.model,
      }));
    }

    return rawOptions.map((opt: string | number) => ({
      label: String(opt),
      value: String(opt),
    }));
  };

  return (
    <div className="flex flex-col gap-3 min-w-[300px] sm:min-w-[600px] p-1">
      {filters.map((filter) => {
        const colDef = COLUMNS.find((c) => c.value === filter.column);
        const operators = getOperators(filter.column);
        const valueOptions = getValueOptions(filter.column);

        return (
          <div key={filter.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-secondary/20 p-2 rounded-md">
            {/* Column Select */}
            <div className="w-full sm:w-1/3">
              <DropdownMenu
                options={COLUMNS.map((c) => ({
                  label: c.label,
                  onClick: () => updateFilter(filter.id, { column: c.value }),
                }))}
              >
                {colDef?.label || filter.column}
              </DropdownMenu>
            </div>

            {/* Operator Select */}
            <div className="w-full sm:w-[140px]">
              <DropdownMenu
                options={operators.map((op) => ({
                  label: op.label,
                  onClick: () => updateFilter(filter.id, { operator: op.value }),
                }))}
              >
                {operators.find((op) => op.value === filter.operator)?.label || filter.operator}
              </DropdownMenu>
            </div>

            {/* Value Input/Select */}
            <div className="flex-1 w-full min-w-0">
              {valueOptions ? (
                <DropdownMenu
                  className="w-full"
                  options={[
                      { label: "Any", onClick: () => updateFilter(filter.id, { value: '' }) },
                      ...valueOptions.map((opt: { label: string; value: string }) => ({
                    label: opt.label,
                    onClick: () => updateFilter(filter.id, { value: opt.value }),
                  }))]}
                >
                  <span className="block truncate">
                    {filter.value || 'Select...'}
                  </span>
                </DropdownMenu>
              ) : (
                <Input
                  value={filter.value}
                  onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                  placeholder="Value..."
                  className="h-9 bg-background"
                />
              )}
            </div>

            {/* Remove Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeFilter(filter.id)}
              className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      })}

      <Button
        variant="outline"
        onClick={addFilter}
        className="self-start gap-2 mt-2"
      >
        <Plus className="h-4 w-4" />
        Add filter
      </Button>
    </div>
  );
}
