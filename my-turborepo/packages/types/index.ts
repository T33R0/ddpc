export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  displayName?: string;
  location?: string;
  website?: string;
  bio?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  role: 'user' | 'helper' | 'admin';
  plan: 'free' | 'pro';
  banned: boolean;
  notifyOnNewUser?: boolean;
  notifyOnIssueReport?: boolean;
}

export interface Vehicle {
  id: string;
  name?: string; // User-defined name/nickname
  make: string;
  model: string;
  year: string;
  trim: string;
  odometer?: number | null; // Current odometer reading
  current_status?: string; // Vehicle status
  privacy?: 'PUBLIC' | 'PRIVATE'; // Privacy setting
  vehicle_image?: string | null; // User-uploaded vehicle image URL
  trim_description?: string;
  base_msrp?: string;
  base_invoice?: string;
  colors_exterior?: string;
  colors_interior?: string;
  body_type?: string;
  doors?: string;
  total_seating?: string;
  length_in?: string;
  width_in?: string;
  height_in?: string;
  wheelbase_in?: string;
  front_track_in?: string;
  rear_track_in?: string;
  ground_clearance_in?: string;
  angle_of_approach_deg?: string;
  angle_of_departure_deg?: string;
  turning_circle_ft?: string;
  drag_coefficient_cd?: string;
  epa_interior_volume_cuft?: string;
  cargo_capacity_cuft?: string;
  max_cargo_capacity_cuft?: string;
  curb_weight_lbs?: string;
  gross_weight_lbs?: string;
  max_payload_lbs?: string;
  max_towing_capacity_lbs?: string;
  cylinders?: string;
  engine_size_l?: string;
  horsepower_hp?: string;
  horsepower_rpm?: string;
  torque_ft_lbs?: string;
  torque_rpm?: string;
  valves?: string;
  valve_timing?: string;
  cam_type?: string;
  drive_type?: string;
  transmission?: string;
  engine_type?: string;
  fuel_type?: string;
  fuel_tank_capacity_gal?: string;
  epa_combined_mpg?: string;
  epa_city_highway_mpg?: string;
  range_miles_city_hwy?: string;
  epa_combined_mpge?: string;
  epa_city_highway_mpge?: string;
  epa_electric_range_mi?: string;
  epa_kwh_per_100mi?: string;
  epa_charge_time_240v_hr?: string;
  battery_capacity_kwh?: string;
  front_head_room_in?: string;
  front_hip_room_in?: string;
  front_leg_room_in?: string;
  front_shoulder_room_in?: string;
  rear_head_room_in?: string;
  rear_hip_room_in?: string;
  rear_leg_room_in?: string;
  rear_shoulder_room_in?: string;
}

export interface TrimVariant extends Vehicle {
  /**
   * Convenience field that contains the first image URL associated with this trim.
   * Consumers can fall back to the full `image_url` list if this field is undefined.
   */
  primaryImage?: string;
}

export interface VehicleSummary {
  /**
   * Stable identifier for the summary entry. Typically derived from year/make/model.
   */
  id: string;
  year: string;
  make: string;
  model: string;
  heroImage?: string;
  trims: TrimVariant[];
  nickname?: string;
  ownerDisplayName?: string;
}

export interface WorkItem {
  id: string;
  vehicleId: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  date: string; // ISO 8601 format
}

// Garage Dashboard Types
export type Tier = 'T0' | 'T1' | 'T2' | 'T3';

export interface KPI {
  key: 'lastEvent' | 'vehicles' | 'nextDue' | 'overdue' | 'stageName' | 'stageETA' | 'budgetUsed' | 'compatFlags' | 'activeBuilds' | 'spendVsPlan' | 'onTimePct' | 'downtime30d';
  label: string;
  value: string;
}

export interface DashboardWorkItem {
  id: string;
  kind: 'historical' | 'maintenance' | 'build' | 'fleet';
  title: string;
  subtitle?: string;
  due?: string;
  vehicleId?: string;
  actions: Array<{
    label: string;
    op: 'markDone' | 'open' | 'convert' | 'assign';
  }>;
}

export interface ActivityItem {
  id: string;
  type: 'event_logged' | 'maintenance_completed' | 'build_updated' | 'ai_query';
  title: string;
  description: string;
  timestamp: string;
  vehicleId?: string;
}

export interface UsageStats {
  vehiclesUsed: number;
  storageUsedGB: number;
  aiTokensUsed: number;
}

export interface EventData {
  id?: string;
  vehicleId: string;
  type: 'maintenance' | 'historical';
  title: string;
  description?: string;
  date: string; // ISO 8601
  odometer?: number;
  photos?: string[];
}

export interface BotMessage {
  intent: 'maintenance_advice' | 'parts_crossref' | 'vehicle_suggestions' | 'performance_advice' | 'compatibility' | 'ops_bulk';
  prompt: string;
  vehicleId?: string;
}

export interface BotResponse {
  response: string;
  tokensUsed: number;
}

export interface UpgradeRequiredError {
  code: 'UPGRADE_REQUIRED';
  targetTier: Tier;
  message: string;
}

// Garage-specific types
export interface VehicleWithOdometer {
  id: string;
  name: string;
  nickname?: string;
  ymmt: string;
  odometer: number | null;
  current_status: string;
  image_url?: string;
  vehicle_image?: string | null; // User-uploaded vehicle image URL
  make?: string;
  model?: string;
  year?: string;
  trim?: string;
}

// Service and Maintenance Types
export interface ServiceInterval {
  id: string;
  user_id?: string;
  user_vehicle_id: string;
  master_service_schedule_id?: string;
  name: string;
  description?: string;
  interval_months?: number | null;
  interval_miles?: number | null;
  due_date?: string | null;
  due_miles?: number | null;
  created_at?: string;
  master_service_schedule?: {
    description?: string;
  } | null;
}

export interface MaintenanceLog {
  id: string;
  user_vehicle_id: string;
  service_interval_id?: string | null;
  description: string;
  cost?: number | null;
  odometer?: number | null;
  event_date: string;
  created_at?: string;
  notes?: string | null;
  service_provider?: string | null;
}