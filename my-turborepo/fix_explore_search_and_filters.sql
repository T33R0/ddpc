-- Fix for Explore Page Issues
-- 1. Performance/Timeout on filters (due to RLS)
-- 2. Search functionality (multi-term support)

-- Enable RLS on vehicle_data if not already enabled (good practice)
ALTER TABLE public.vehicle_data ENABLE ROW LEVEL SECURITY;

-- Allow public read access to vehicle_data
-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access" ON public.vehicle_data;
CREATE POLICY "Allow public read access"
ON public.vehicle_data
FOR SELECT
TO public
USING (true);

-- Update get_vehicle_filter_options to be SECURITY DEFINER
-- This bypasses RLS overhead for this specific heavy aggregation query
CREATE OR REPLACE FUNCTION public.get_vehicle_filter_options()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Run as owner to bypass RLS
SET search_path = public, extensions, pg_temp
STABLE
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'years', ARRAY(SELECT DISTINCT year FROM vehicle_data WHERE year IS NOT NULL ORDER BY year DESC),
    'makes', ARRAY(SELECT DISTINCT make FROM vehicle_data WHERE make IS NOT NULL ORDER BY make ASC),
    'models', ARRAY(SELECT DISTINCT model FROM vehicle_data WHERE model IS NOT NULL ORDER BY model ASC),
    'engineTypes', ARRAY(SELECT DISTINCT cylinders FROM vehicle_data WHERE cylinders IS NOT NULL ORDER BY cylinders ASC),
    'fuelTypes', ARRAY(SELECT DISTINCT fuel_type FROM vehicle_data WHERE fuel_type IS NOT NULL ORDER BY fuel_type ASC),
    'drivetrains', ARRAY(SELECT DISTINCT drive_type FROM vehicle_data WHERE drive_type IS NOT NULL ORDER BY drive_type ASC),
    'bodyTypes', ARRAY(SELECT DISTINCT body_type FROM vehicle_data WHERE body_type IS NOT NULL ORDER BY body_type ASC)
  ) INTO result;

  RETURN result;
END;
$$;

-- Update get_unique_vehicles_with_trims to support multi-term search
-- Also set SECURITY DEFINER to ensure consistent performance
CREATE OR REPLACE FUNCTION public.get_unique_vehicles_with_trims(
  limit_param integer DEFAULT 50,
  offset_param integer DEFAULT 0,
  min_year_param integer DEFAULT NULL,
  max_year_param integer DEFAULT NULL,
  make_param text DEFAULT NULL,
  model_param text DEFAULT NULL,
  engine_type_param text DEFAULT NULL,
  fuel_type_param text DEFAULT NULL,
  drivetrain_param text DEFAULT NULL,
  vehicle_type_param text DEFAULT NULL,
  search_query text DEFAULT NULL
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
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
STABLE 
AS $$
BEGIN
  RETURN QUERY
  WITH visible_groups AS (
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
      AND (
        search_query IS NULL 
        OR search_query = '' 
        OR (
           -- Multi-term search logic:
           -- Concatenate fields and check if the search query matches
           CONCAT_WS(' ', vd.year, vd.make, vd.model, vd.trim) ILIKE '%' || search_query || '%'
        )
      )
    GROUP BY vd.year, vd.make, vd.model
    ORDER BY vd.year DESC, vd.make ASC, vd.model ASC
    LIMIT limit_param OFFSET offset_param
  ),
  relevant_vehicles AS (
    SELECT vd.*
    FROM vehicle_data vd
    JOIN visible_groups vg ON vd.year = vg.year AND vd.make = vg.make AND vd.model = vg.model
  ),
  images AS (
    SELECT DISTINCT ON (vpi.vehicle_id) vpi.vehicle_id, vpi.url
    FROM vehicle_primary_image vpi
    JOIN relevant_vehicles rv ON vpi.vehicle_id = rv.id
    ORDER BY vpi.vehicle_id
  )
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
