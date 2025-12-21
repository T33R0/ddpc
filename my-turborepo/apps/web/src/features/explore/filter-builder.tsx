'use client';

import React from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import type { SupabaseFilter, FilterOptions, FilterOperator } from './types';

interface FilterBuilderProps {
  filters: SupabaseFilter[];
  onChange: (filters: SupabaseFilter[]) => void;
  options: FilterOptions;
}

type ColumnDef = {
  label: string;
  value: string;
  type: 'numeric' | 'text';
  optionsKey?: keyof FilterOptions;
};

const COLUMNS: ColumnDef[] = [
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
];

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

        // Reset value if column changes to prevent type mismatch
        if (updates.column && updates.column !== f.column) {
          updated.value = '';
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

    const key = col.optionsKey;
    // @ts-ignore - Index access safe due to type definition
    const rawOptions = options[key];

    if (columnValue === 'model') {
      const models = rawOptions as { make: string; model: string }[];
      // If we have a Make filter in ANY row, filtering models would be nice, but row-based is independent.
      // However, showing 70k models is bad.
      // We should probably filter models if the CURRENT row has a sibling filter for Make?
      // Or just show all (which is heavy)?
      // For now, we list all models, but distinct names?
      // The API returns distinct {make, model}.
      // We'll show "Make Model" in the dropdown.
      return models.map((m) => ({
        label: `${m.make} ${m.model}`,
        value: m.model, // Filtering by model name
      }));
    }

    const simpleOptions = rawOptions as (string | number)[];
    return simpleOptions.map((opt) => ({
      label: String(opt),
      value: String(opt),
    }));
  };

  return (
    <div className="flex flex-col gap-3 min-w-[300px] w-full p-1">
      {filters.map((filter) => {
        const colDef = COLUMNS.find((c) => c.value === filter.column);
        const operators = getOperators(filter.column);
        const valueOptions = getValueOptions(filter.column);

        return (
          <div key={filter.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-secondary/20 p-2 rounded-md">
            {/* Column Select */}
            <div className="w-full sm:w-1/3">
              <select
                value={filter.column}
                onChange={(e) => updateFilter(filter.id, { column: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {COLUMNS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Operator Select */}
            <div className="w-full sm:w-[140px]">
              <select
                value={filter.operator}
                // @ts-ignore - value cast
                onChange={(e) => updateFilter(filter.id, { operator: e.target.value as FilterOperator })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {operators.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Value Input/Select */}
            <div className="flex-1 w-full min-w-0">
              {valueOptions ? (
                <select
                  value={filter.value}
                  onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Any</option>
                  {valueOptions.map((opt) => (
                    <option key={opt.value + opt.label} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
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
              aria-label="Remove filter"
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
