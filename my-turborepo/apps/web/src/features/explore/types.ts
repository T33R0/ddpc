export type FilterOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'ilike';

export interface SupabaseFilter {
  id: string;
  column: string;
  operator: FilterOperator;
  value: string;
}

export interface FilterOptions {
  years: number[];
  makes: string[];
  models: { make: string; model: string }[];
  engineTypes: string[];
  fuelTypes: string[];
  drivetrains: string[];
  bodyTypes: string[];
  countries: string[];
}
