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
  plan: 'free' | 'builder' | 'pro';
  banned: boolean;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: string;
  trim: string;
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
  warranty_basic?: string;
  warranty_drivetrain?: string;
  warranty_roadside?: string;
  warranty_rust?: string;
  source_json?: string;
  source_url?: string;
  image_url?: string;
  review?: string;
  pros?: string;
  cons?: string;
  whats_new?: string;
  nhtsa_overall_rating?: string;
  new_price_range?: string;
  used_price_range?: string;
  scorecard_overall?: string;
  scorecard_driving?: string;
  scorecard_confort?: string;
  scorecard_interior?: string;
  scorecard_utility?: string;
  scorecard_technology?: string;
  expert_verdict?: string;
  expert_performance?: string;
  expert_comfort?: string;
  expert_interior?: string;
  expert_technology?: string;
  expert_storage?: string;
  expert_fuel_economy?: string;
  expert_value?: string;
  expert_wildcard?: string;
  old_trim?: string;
  old_description?: string;
  images_url?: string;
  suspension?: string;
  front_seats?: string;
  rear_seats?: string;
  power_features?: string;
  instrumentation?: string;
  convenience?: string;
  comfort?: string;
  memorized_settings?: string;
  in_car_entertainment?: string;
  roof_and_glass?: string;
  body?: string;
  truck_features?: string;
  tires_and_wheels?: string;
  doors_features?: string;
  towing_and_hauling?: string;
  safety_features?: string;
  packages?: string;
  exterior_options?: string;
  interior_options?: string;
  mechanical_options?: string;
  country_of_origin?: string;
  car_classification?: string;
  platform_code_generation?: string;
  date_added?: string;
  new_make?: string;
  new_model?: string;
  new_year?: string;
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