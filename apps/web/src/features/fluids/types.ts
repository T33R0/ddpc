export type FluidType =
  | 'engine_oil'
  | 'coolant'
  | 'brake_fluid'
  | 'transmission'
  | 'differential'
  | 'power_steering'
  | 'transfer_case'
  | 'custom';

export type FluidChangeReason = 'scheduled' | 'repair' | 'flush' | 'top_off';

export type FluidStatus = 'active' | 'due' | 'overdue';

export interface VehicleFluid {
  id: string;
  vehicle_id: string;
  user_id: string;
  name: string;
  fluid_type: FluidType;
  specification: string | null;
  capacity: string | null;
  last_changed_at: string | null;
  last_changed_miles: number | null;
  lifespan_months: number | null;
  lifespan_miles: number | null;
  status: FluidStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FluidChange {
  id: string;
  fluid_id: string;
  job_id: string | null;
  changed_at: string;
  odometer: number | null;
  old_specification: string | null;
  new_specification: string;
  change_reason: FluidChangeReason;
  cost: number | null;
  notes: string | null;
  created_at: string;
}

export interface FluidWithHealth extends VehicleFluid {
  health_percent: number;
  health_status: 'good' | 'warning' | 'critical';
  miles_remaining: number | null;
  months_remaining: number | null;
  changes?: FluidChange[];
}
