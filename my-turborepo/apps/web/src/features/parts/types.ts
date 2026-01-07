export interface ComponentDefinition {
  id: string;
  name: string;
  category: string;
  default_lifespan_months: number | null;
  default_lifespan_miles: number | null;
}

export interface MasterPart {
  id: string;
  name: string;
  part_number: string;
  vendor_link: string | null;
}

export interface VehicleInstalledComponent {
  user_vehicle_id: string;
  component_definition_id: string;
  current_part_id: string;
  installed_date: string | null; // ISO Date string
  installed_mileage: number | null;
  master_part?: MasterPart; // Joined data
}

export interface UserVehicle {
  id: string;
  odometer: number;
}

// Combined type for UI consumption
export interface PartSlot extends ComponentDefinition {
  installedComponent?: VehicleInstalledComponent;
}

export interface PartsDataResponse {
  vehicle: UserVehicle;
  slots: PartSlot[];
}
