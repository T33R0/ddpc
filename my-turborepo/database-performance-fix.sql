-- Database Performance Optimization for /explore page
-- This migration adds indexes and optimizes the get_unique_vehicles_with_trims function
-- to prevent timeouts when filtering by year range

-- ============================================================================
-- STEP 1: Add Indexes for Better Query Performance
-- ============================================================================

-- Index on year column (stored as text, but frequently cast to integer)
CREATE INDEX IF NOT EXISTS idx_vehicle_data_year 
ON vehicle_data(year);

-- Index on make column
CREATE INDEX IF NOT EXISTS idx_vehicle_data_make 
ON vehicle_data(make);

-- Index on model column
CREATE INDEX IF NOT EXISTS idx_vehicle_data_model 
ON vehicle_data(model);

-- Composite index on year, make, model for common filter combinations
CREATE INDEX IF NOT EXISTS idx_vehicle_data_ymm 
ON vehicle_data(year, make, model);

-- Index on fuel_type for fuel filter
CREATE INDEX IF NOT EXISTS idx_vehicle_data_fuel_type 
ON vehicle_data(fuel_type);

-- Index on drive_type for drivetrain filter
CREATE INDEX IF NOT EXISTS idx_vehicle_data_drive_type 
ON vehicle_data(drive_type);

-- Index on body_type for vehicle type filter
CREATE INDEX IF NOT EXISTS idx_vehicle_data_body_type 
ON vehicle_data(body_type);

-- ============================================================================
-- STEP 2: Optimize the get_unique_vehicles_with_trims Function
-- ============================================================================

CREATE OR REPLACE FUNCTION get_unique_vehicles_with_trims(
  limit_param integer DEFAULT 50,
  offset_param integer DEFAULT 0,
  min_year_param integer DEFAULT NULL,
  max_year_param integer DEFAULT NULL,
  make_param text DEFAULT NULL,
  model_param text DEFAULT NULL,
  engine_type_param text DEFAULT NULL,
  fuel_type_param text DEFAULT NULL,
  drivetrain_param text DEFAULT NULL,
  vehicle_type_param text DEFAULT NULL
)
RETURNS TABLE(
  id text,
  make text,
  model text,
  year text,
  hero_image text,
  trims jsonb
)
LANGUAGE plpgsql
STABLE  -- Mark as STABLE for better query planning
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_vehicles AS (
    -- First, filter the vehicles based on criteria
    SELECT
      vd.id,
      vd.year,
      vd.make,
      vd.model,
      vd."trim",
      vd.trim_description,
      vd.body_type,
      vd.fuel_type,
      vd.transmission,
      vd.drive_type,
      vd.curb_weight_lbs,
      vd.cylinders,
      vd.engine_size_l,
      vd.horsepower_hp,
      vd.horsepower_rpm,
      vd.torque_ft_lbs,
      vd.torque_rpm,
      vd.epa_combined_mpg,
      vd.length_in,
      vd.width_in,
      vd.height_in,
      vd.wheelbase_in,
      vd.front_track_in,
      vd.rear_track_in,
      vd.ground_clearance_in
    FROM vehicle_data vd
    WHERE
      (min_year_param IS NULL OR vd.year::integer >= min_year_param) AND
      (max_year_param IS NULL OR vd.year::integer <= max_year_param) AND
      (make_param IS NULL OR vd.make = make_param) AND
      (model_param IS NULL OR vd.model = model_param) AND
      (engine_type_param IS NULL OR vd.cylinders = engine_type_param) AND
      (fuel_type_param IS NULL OR vd.fuel_type = fuel_type_param) AND
      (drivetrain_param IS NULL OR vd.drive_type = drivetrain_param) AND
      (vehicle_type_param IS NULL OR vd.body_type = vehicle_type_param)
  ),
  vehicle_images AS (
    -- Pre-fetch images for all filtered vehicles
    SELECT DISTINCT ON (vpi.vehicle_id)
      vpi.vehicle_id,
      vpi.url
    FROM vehicle_primary_image vpi
    WHERE vpi.vehicle_id IN (SELECT id FROM filtered_vehicles)
    ORDER BY vpi.vehicle_id, vpi.url
  ),
  grouped_vehicles AS (
    -- Group vehicles by year/make/model
    SELECT
      fv.year,
      fv.make,
      fv.model,
      jsonb_agg(
        jsonb_build_object(
          'id', fv.id,
          'trim', fv."trim",
          'trim_description', fv.trim_description,
          'image_url', COALESCE(vi.url, ''),
          'body_type', fv.body_type,
          'fuel_type', fv.fuel_type,
          'transmission', fv.transmission,
          'drive_type', fv.drive_type,
          'curb_weight_lbs', fv.curb_weight_lbs,
          'cylinders', fv.cylinders,
          'engine_size_l', fv.engine_size_l,
          'horsepower_hp', fv.horsepower_hp,
          'horsepower_rpm', fv.horsepower_rpm,
          'torque_ft_lbs', fv.torque_ft_lbs,
          'torque_rpm', fv.torque_rpm,
          'epa_combined_mpg', fv.epa_combined_mpg,
          'length_in', fv.length_in,
          'width_in', fv.width_in,
          'height_in', fv.height_in,
          'wheelbase_in', fv.wheelbase_in,
          'front_track_in', fv.front_track_in,
          'rear_track_in', fv.rear_track_in,
          'ground_clearance_in', fv.ground_clearance_in
        )
        ORDER BY fv."trim" ASC
      ) as trims,
      -- Get the first image URL as hero image
      (SELECT vi2.url FROM vehicle_images vi2 
       WHERE vi2.vehicle_id = MIN(fv.id) 
       LIMIT 1) as hero_image
    FROM filtered_vehicles fv
    LEFT JOIN vehicle_images vi ON vi.vehicle_id = fv.id
    GROUP BY fv.year, fv.make, fv.model
  )
  SELECT
    CONCAT(gv.year, '-', gv.make, '-', gv.model) as id,
    gv.make,
    gv.model,
    gv.year,
    COALESCE(gv.hero_image, '') as hero_image,
    gv.trims
  FROM grouped_vehicles gv
  ORDER BY
    gv.year DESC,
    gv.make ASC,
    gv.model ASC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;

-- ============================================================================
-- STEP 3: Add Statement Timeout Configuration
-- ============================================================================

-- Set a reasonable statement timeout for this function (10 seconds)
-- This prevents indefinite hangs while still allowing complex queries
ALTER FUNCTION get_unique_vehicles_with_trims(
  integer, integer, integer, integer, text, text, text, text, text, text
) SET statement_timeout = '10s';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Test the function with year filter (should complete quickly now)
-- SELECT * FROM get_unique_vehicles_with_trims(
--   limit_param := 24,
--   offset_param := 0,
--   min_year_param := 2018,
--   max_year_param := 2019
-- );

-- Check index usage with EXPLAIN ANALYZE
-- EXPLAIN ANALYZE
-- SELECT * FROM vehicle_data
-- WHERE year::integer >= 2018 AND year::integer <= 2019;
