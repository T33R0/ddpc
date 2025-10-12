-- Vehicle aggregation functions for DDPC discover page
-- These functions need to be created in Supabase SQL editor

-- Function to get unique vehicles with all their trims
CREATE OR REPLACE FUNCTION get_unique_vehicles_with_trims(limit_param integer DEFAULT 50, offset_param integer DEFAULT 0)
RETURNS TABLE(
  id text,
  make text,
  model text,
  year text,
  hero_image text,
  trims jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    CONCAT(vd.year, '-', vd.make, '-', vd.model) as id,
    vd.make,
    vd.model,
    vd.year,
    (array_agg(vd.image_url))[1] as hero_image,  -- Take first image as hero
    jsonb_agg(
      jsonb_build_object(
        'id', vd.id,
        'trim', vd."trim",
        'trim_description', vd.trim_description,
        'base_msrp', vd.base_msrp,
        'base_invoice', vd.base_invoice,
        'colors_exterior', vd.colors_exterior,
        'colors_interior', vd.colors_interior,
        'body_type', vd.body_type,
        'doors', vd.doors,
        'total_seating', vd.total_seating,
        'length_in', vd.length_in,
        'width_in', vd.width_in,
        'height_in', vd.height_in,
        'wheelbase_in', vd.wheelbase_in,
        'front_track_in', vd.front_track_in,
        'rear_track_in', vd.rear_track_in,
        'ground_clearance_in', vd.ground_clearance_in,
        'angle_of_approach_deg', vd.angle_of_approach_deg,
        'angle_of_departure_deg', vd.angle_of_departure_deg,
        'turning_circle_ft', vd.turning_circle_ft,
        'drag_coefficient_cd', vd.drag_coefficient_cd,
        'epa_interior_volume_cuft', vd.epa_interior_volume_cuft,
        'cargo_capacity_cuft', vd.cargo_capacity_cuft,
        'max_cargo_capacity_cuft', vd.max_cargo_capacity_cuft,
        'curb_weight_lbs', vd.curb_weight_lbs,
        'gross_weight_lbs', vd.gross_weight_lbs,
        'max_payload_lbs', vd.max_payload_lbs,
        'max_towing_capacity_lbs', vd.max_towing_capacity_lbs,
        'cylinders', vd.cylinders,
        'engine_size_l', vd.engine_size_l,
        'horsepower_hp', vd.horsepower_hp,
        'horsepower_rpm', vd.horsepower_rpm,
        'torque_ft_lbs', vd.torque_ft_lbs,
        'torque_rpm', vd.torque_rpm,
        'valves', vd.valves,
        'valve_timing', vd.valve_timing,
        'cam_type', vd.cam_type,
        'drive_type', vd.drive_type,
        'transmission', vd.transmission,
        'engine_type', vd.engine_type,
        'fuel_type', vd.fuel_type,
        'fuel_tank_capacity_gal', vd.fuel_tank_capacity_gal,
        'epa_combined_mpg', vd.epa_combined_mpg,
        'epa_city_highway_mpg', vd.epa_city_highway_mpg,
        'range_miles_city_hwy', vd.range_miles_city_hwy,
        'epa_combined_mpge', vd.epa_combined_mpge,
        'epa_city_highway_mpge', vd.epa_city_highway_mpge,
        'epa_electric_range_mi', vd.epa_electric_range_mi,
        'epa_kwh_per_100mi', vd.epa_kwh_per_100mi,
        'epa_charge_time_240v_hr', vd.epa_charge_time_240v_hr,
        'battery_capacity_kwh', vd.battery_capacity_kwh,
        'front_head_room_in', vd.front_head_room_in,
        'front_hip_room_in', vd.front_hip_room_in,
        'front_leg_room_in', vd.front_leg_room_in,
        'front_shoulder_room_in', vd.front_shoulder_room_in,
        'rear_head_room_in', vd.rear_head_room_in,
        'rear_hip_room_in', vd.rear_hip_room_in,
        'rear_leg_room_in', vd.rear_leg_room_in,
        'rear_shoulder_room_in', vd.rear_shoulder_room_in,
        'warranty_basic', vd.warranty_basic,
        'warranty_drivetrain', vd.warranty_drivetrain,
        'warranty_roadside', vd.warranty_roadside,
        'warranty_rust', vd.warranty_rust,
        'source_json', vd.source_json,
        'source_url', vd.source_url,
        'image_url', vd.image_url,
        'review', vd.review,
        'pros', vd.pros,
        'cons', vd.cons,
        'whats_new', vd.whats_new,
        'nhtsa_overall_rating', vd.nhtsa_overall_rating,
        'new_price_range', vd.new_price_range,
        'used_price_range', vd.used_price_range,
        'scorecard_overall', vd.scorecard_overall,
        'scorecard_driving', vd.scorecard_driving,
        'scorecard_confort', vd.scorecard_confort,
        'scorecard_interior', vd.scorecard_interior,
        'scorecard_utility', vd.scorecard_utility,
        'scorecard_technology', vd.scorecard_technology,
        'expert_verdict', vd.expert_verdict,
        'expert_performance', vd.expert_performance,
        'expert_comfort', vd.expert_comfort,
        'expert_interior', vd.expert_interior,
        'expert_technology', vd.expert_technology,
        'expert_storage', vd.expert_storage,
        'expert_fuel_economy', vd.expert_fuel_economy,
        'expert_value', vd.expert_value,
        'expert_wildcard', vd.expert_wildcard,
        'old_trim', vd.old_trim,
        'old_description', vd.old_description,
        'images_url', vd.images_url,
        'suspension', vd.suspension,
        'front_seats', vd.front_seats,
        'rear_seats', vd.rear_seats,
        'power_features', vd.power_features,
        'instrumentation', vd.instrumentation,
        'convenience', vd.convenience,
        'comfort', vd.comfort,
        'memorized_settings', vd.memorized_settings,
        'in_car_entertainment', vd.in_car_entertainment,
        'roof_and_glass', vd.roof_and_glass,
        'body', vd.body,
        'truck_features', vd.truck_features,
        'tires_and_wheels', vd.tires_and_wheels,
        'doors_features', vd.doors_features,
        'towing_and_hauling', vd.towing_and_hauling,
        'safety_features', vd.safety_features,
        'packages', vd.packages,
        'exterior_options', vd.exterior_options,
        'interior_options', vd.interior_options,
        'mechanical_options', vd.mechanical_options,
        'country_of_origin', vd.country_of_origin,
        'car_classification', vd.car_classification,
        'platform_code_generation', vd.platform_code_generation,
        'date_added', vd.date_added,
        'new_make', vd.new_make,
        'new_model', vd.new_model,
        'new_year', vd.new_year
      )
      ORDER BY vd."trim" ASC
    ) as trims
  FROM vehicle_data vd
  GROUP BY vd.year, vd.make, vd.model
  ORDER BY
    vd.year DESC,
    vd.make ASC,
    vd.model ASC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;

-- Function to get comprehensive filter options from all vehicle data
CREATE OR REPLACE FUNCTION get_vehicle_filter_options()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'years', ARRAY(SELECT DISTINCT year::integer FROM vehicle_data ORDER BY year::integer DESC),
    'makes', ARRAY(SELECT DISTINCT make FROM vehicle_data ORDER BY make ASC),
    'models', ARRAY(SELECT DISTINCT model FROM vehicle_data ORDER BY model ASC),
    'engineTypes', ARRAY(SELECT DISTINCT cylinders FROM vehicle_data WHERE cylinders IS NOT NULL ORDER BY cylinders ASC),
    'fuelTypes', ARRAY(SELECT DISTINCT fuel_type FROM vehicle_data WHERE fuel_type IS NOT NULL ORDER BY fuel_type ASC),
    'drivetrains', ARRAY(SELECT DISTINCT drive_type FROM vehicle_data WHERE drive_type IS NOT NULL ORDER BY drive_type ASC),
    'bodyTypes', ARRAY(SELECT DISTINCT body_type FROM vehicle_data WHERE body_type IS NOT NULL ORDER BY body_type ASC)
  ) INTO result;

  RETURN result;
END;
$$;
