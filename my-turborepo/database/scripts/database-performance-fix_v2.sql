-- Drop existing function to allow signature change
DROP FUNCTION IF EXISTS get_unique_vehicles_with_trims(
  integer,
  integer,
  integer,
  integer,
  text,
  text,
  text,
  text,
  text,
  text
);

-- Recreate optimized function with Limit-First strategy
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
) LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
  WITH visible_groups AS (
    -- 1. Identify the specific Year/Make/Model groups to display FIRST
    -- This applies the LIMIT/OFFSET before joining heavy data
    SELECT vd.year, vd.make, vd.model
    FROM vehicle_data vd
    WHERE (min_year_param IS NULL OR vd.year::integer >= min_year_param)
      AND (max_year_param IS NULL OR vd.year::integer <= max_year_param)
      AND (make_param IS NULL OR vd.make = make_param)
      AND (model_param IS NULL OR vd.model = model_param)
      AND (engine_type_param IS NULL OR vd.cylinders = engine_type_param)
      AND (fuel_type_param IS NULL OR vd.fuel_type = fuel_type_param)
      AND (drivetrain_param IS NULL OR vd.drive_type = drivetrain_param)
      AND (vehicle_type_param IS NULL OR vd.body_type = vehicle_type_param)
    GROUP BY vd.year, vd.make, vd.model
    ORDER BY vd.year DESC, vd.make ASC, vd.model ASC
    LIMIT limit_param OFFSET offset_param
  ),
  relevant_vehicles AS (
    -- 2. Fetch only the vehicles belonging to the visible groups
    SELECT vd.*
    FROM vehicle_data vd
    JOIN visible_groups vg ON vd.year = vg.year AND vd.make = vg.make AND vd.model = vg.model
  ),
  images AS (
    -- 3. Fetch images only for the relevant vehicles
    SELECT DISTINCT ON (vpi.vehicle_id) vpi.vehicle_id, vpi.url
    FROM vehicle_primary_image vpi
    JOIN relevant_vehicles rv ON vpi.vehicle_id = rv.id
    ORDER BY vpi.vehicle_id
  )
  -- 4. Aggregate the results
  SELECT
    CONCAT(rv.year, '-', rv.make, '-', rv.model) AS id,
    rv.make,
    rv.model,
    rv.year,
    COALESCE(MAX(i.url), '') AS hero_image,
    jsonb_agg(
      jsonb_build_object(
        'id', rv.id,
        'trim', rv."trim",
        'trim_description', rv.trim_description,
        'image_url', COALESCE(i.url, ''),
        'body_type', rv.body_type,
        'fuel_type', rv.fuel_type,
        'transmission', rv.transmission,
        'drive_type', rv.drive_type,
        'cylinders', rv.cylinders,
        'engine_size_l', rv.engine_size_l,
        'horsepower_hp', rv.horsepower_hp,
        'doors', rv.doors,
        'pros', rv.pros,
        'cons', rv.cons,
        'country_of_origin', rv.country_of_origin,
        'car_classification', rv.car_classification,
        'platform_code_generation', rv.platform_code_generation
      ) ORDER BY rv."trim" ASC
    ) AS trims
  FROM relevant_vehicles rv
  LEFT JOIN images i ON i.vehicle_id = rv.id
  GROUP BY rv.year, rv.make, rv.model
  ORDER BY rv.year DESC, rv.make ASC, rv.model ASC;
END;
$$;

-- Indexes to improve filter performance
-- Note: Adding functional index for year::integer to support range queries
CREATE INDEX IF NOT EXISTS idx_vehicle_data_year_int ON vehicle_data((year::integer));
CREATE INDEX IF NOT EXISTS idx_vehicle_data_year ON vehicle_data(year);
CREATE INDEX IF NOT EXISTS idx_vehicle_data_make ON vehicle_data(make);
CREATE INDEX IF NOT EXISTS idx_vehicle_data_model ON vehicle_data(model);
CREATE INDEX IF NOT EXISTS idx_vehicle_data_ymm ON vehicle_data(year, make, model);
CREATE INDEX IF NOT EXISTS idx_vehicle_data_fuel_type ON vehicle_data(fuel_type);
CREATE INDEX IF NOT EXISTS idx_vehicle_data_drive_type ON vehicle_data(drive_type);
CREATE INDEX IF NOT EXISTS idx_vehicle_data_body_type ON vehicle_data(body_type);
