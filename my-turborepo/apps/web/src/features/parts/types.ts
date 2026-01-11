export interface ComponentType {
  id: string;
  name: string;
  category: string;
  default_lifespan_months: number | null;
  default_lifespan_miles: number | null;
  spec_schema?: Record<string, any>; // JSONB
}

export interface MasterPart {
  id: string;
  name: string;
  part_number: string;
  vendor_link: string | null;
}

export interface VehicleInstalledComponent {
  id?: string;
  user_vehicle_id: string;
  component_definition_id: string; // Keeping column name for now, points to component_types
  bom_id?: string; // Link to vehicle_bom
  current_part_id: string;
  installed_date: string | null; // ISO Date string
  installed_mileage: number | null;
  custom_lifespan_miles: number | null;
  custom_lifespan_months: number | null;
  purchase_cost: number | null;
  status: 'installed' | 'planned';
  specs?: Record<string, any>; // JSONB for specific values
  master_part?: MasterPart; // Joined data
}

export interface UserVehicle {
  id: string;
  odometer: number;
}

// Combined type for UI consumption
export interface PartSlot extends ComponentType {
  installedComponent?: VehicleInstalledComponent;
}

export interface PartsDataResponse {
  vehicle: UserVehicle;
  slots: PartSlot[];
}
