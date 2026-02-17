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
  quantity: number; // default 1
  purchased_at: string | null;
  tracking_number?: string | null;
  carrier?: string | null;
  status: 'installed' | 'planned' | 'wishlist' | 'in_stock' | 'ordered' | 'replaced'; // expanded status

  master_part_id?: string; // Foreign Key to master_parts
  master_part?: MasterPart; // Joined
  specs?: Record<string, any>;
  lifespan_miles?: number | null;
  lifespan_months?: number | null;
  priority?: number;
  order_id?: string | null;

  // Decomposition & Hardware fields
  parent_id?: string | null;
  install_group_id?: string | null;
  inventory_source_id?: string | null;
  visibility?: 'public' | 'hardware' | 'history_only';
  hardware?: VehicleInstalledComponent[];

  // Replacement tracking
  install_batch_id?: string | null;
  replacement_reason?: 'wear' | 'upgrade' | 'failure' | 'scheduled' | null;
  replaced_part_id?: string | null;
  replaced_part?: VehicleInstalledComponent | null;
  is_reusable?: boolean;

  // Inspection link
  inspection_finding_id?: string | null;
}

export interface Order {
  id: string;
  user_id: string;
  vehicle_id?: string;
  vendor: string;
  order_number?: string;
  order_date: string;
  status: 'ordered' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  tax: number;
  shipping_cost: number;
  total: number;
  tracking_number?: string;
  carrier?: string;
  created_at: string;
  updated_at: string;
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

export interface PartFormData {
  // Base fields
  partName: string;
  category: string;
  variant: string;
  partNumber: string;
  vendorLink: string;
  installedDate: string;
  installedMileage: string;
  purchaseCost: string;
  customLifespanMiles: string;
  customLifespanMonths: string;
  acquisitionType?: string;
  
  // Type selection
  partType?: string;
}

export interface TireSpecificData {
  // Front tire (or all if not staggered)
  width: number;
  aspectRatio: number;
  diameter: number;
  
  // Optional fields
  speedRating?: string;
  loadIndex?: number;
  dotDateCode?: string;
  treadDepthAtInstall?: number;
  
  // Staggered setup
  isStaggered?: boolean;
  position?: 'front' | 'rear' | 'all';
  
  // Rear tire (if staggered)
  rearWidth?: number;
  rearAspectRatio?: number;
  rearDiameter?: number;
}

export type TypeSpecificData = TireSpecificData | Record<string, unknown>;
