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

-- Recreate optimized function with same signature
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
  WITH filtered AS (
    SELECT vd.*
    FROM vehicle_data vd
    WHERE (min_year_param IS NULL OR vd.year::integer >= min_year_param)
      AND (max_year_param IS NULL OR vd.year::integer <= max_year_param)
      AND (make_param IS NULL OR vd.make = make_param)
      AND (model_param IS NULL OR vd.model = model_param)
      AND (engine_type_param IS NULL OR vd.cylinders = engine_type_param)
      AND (fuel_type_param IS NULL OR vd.fuel_type = fuel_type_param)
      AND (drivetrain_param IS NULL OR vd.drive_type = drivetrain_param)
      AND (vehicle_type_param IS NULL OR vd.body_type = vehicle_type_param)
  ),
  images AS (
    SELECT DISTINCT ON (vpi.vehicle_id) vpi.vehicle_id, vpi.url
    FROM vehicle_primary_image vpi
    WHERE vpi.vehicle_id IN (SELECT vd.id FROM filtered vd)
    ORDER BY vpi.vehicle_id, vpi.id
  ),
  grouped AS (
    SELECT
      CONCAT(vd.year, '-', vd.make, '-', vd.model) AS id,
      vd.make,
      vd.model,
      vd.year,
      COALESCE(i.url, '') AS hero_image,
      jsonb_agg(
        jsonb_build_object(
          'id', vd.id,
          'trim', vd."trim",
          'trim_description', vd.trim_description,
          'image_url', COALESCE(i.url, ''),
          'body_type', vd.body_type,
          'fuel_type', vd.fuel_type,
          'transmission', vd.transmission,
          'drive_type', vd.drive_type,
          'cylinders', vd.cylinders,
          'engine_size_l', vd.engine_size_l,
          'horsepower_hp', vd.horsepower_hp,
          'doors', vd.doors,
          'pros', vd.pros,
          'cons', vd.cons,
          'country_of_origin', vd.country_of_origin,
          'car_classification', vd.car_classification,
          'platform_code_generation', vd.platform_code_generation
        ) ORDER BY vd."trim" ASC
      ) AS trims
    FROM filtered vd
    LEFT JOIN images i ON i.vehicle_id = vd.id
    GROUP BY vd.year, vd.make, vd.model, i.url
    ORDER BY vd.year DESC, vd.make ASC, vd.model ASC
    LIMIT limit_param OFFSET offset_param
  )
  SELECT * FROM grouped;
END;
$$;

-- Indexes to improve filter performance
CREATE INDEX IF NOT EXISTS idx_vehicle_data_year ON vehicle_data(year);
CREATE INDEX IF NOT EXISTS idx_vehicle_data_make ON vehicle_data(make);
CREATE INDEX IF NOT EXISTS idx_vehicle_data_model ON vehicle_data(model);
CREATE INDEX IF NOT EXISTS idx_vehicle_data_ymm ON vehicle_data(year, make, model);
CREATE INDEX IF NOT EXISTS idx_vehicle_data_fuel_type ON vehicle_data(fuel_type);
CREATE INDEX IF NOT EXISTS idx_vehicle_data_drive_type ON vehicle_data(drive_type);
CREATE INDEX IF NOT EXISTS idx_vehicle_data_body_type ON vehicle_data(body_type);
