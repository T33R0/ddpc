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
  affiliate_url: string | null;
  category?: string; // e.g. 'brakes', 'engine'
}

// Mapped to 'inventory' table
export interface VehicleInstalledComponent {
  id: string;
  vehicle_id: string; // Changed from user_vehicle_id
  component_definition_id: string | null; // Optional link to defs

  // Inventory columns
  name: string;
  part_number: string | null;
  purchase_url: string | null;
  category: string | null;
  variant: string | null;

  // Installation details
  installed_at: string | null;
  install_miles: number | null;
  purchase_price: number | null; // was purchase_cost
  status: 'installed' | 'planned' | 'wishlist' | 'in_stock' | 'ordered'; // expanded status

  master_part_id?: string; // Foreign Key to master_parts
  master_part?: MasterPart; // Joined
  specs?: Record<string, any>;
  lifespan_miles?: number | null;
  lifespan_months?: number | null;
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
  inventory: VehicleInstalledComponent[];
}
