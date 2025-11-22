-- Migration to add search functionality and fix filter options
-- Run this in the Supabase SQL Editor

-- 1. Update get_unique_vehicles_with_trims to support search
DROP FUNCTION IF EXISTS get_unique_vehicles_with_trims(
  integer, integer, integer, integer, text, text, text, text, text, text
);

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
) LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
  WITH visible_groups AS (
    -- 1. Identify the specific Year/Make/Model groups to display FIRST
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
        OR vd.make ILIKE '%' || search_query || '%' 
        OR vd.model ILIKE '%' || search_query || '%' 
        OR vd.year ILIKE '%' || search_query || '%'
      )
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

-- 2. Optimize get_vehicle_filter_options
-- Using a faster approach that avoids scanning the whole table multiple times if possible
-- But for now, let's just ensure it's using the indexes and maybe increase timeout if we could (but we can't easily from here)
-- We will rewrite it to be slightly more efficient by using the indexes explicitly if needed, but the previous version was okay if indexes exist.
-- Let's just make sure it's defined correctly.

DROP FUNCTION IF EXISTS get_vehicle_filter_options();

CREATE OR REPLACE FUNCTION get_vehicle_filter_options()
RETURNS json
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  result json;
BEGIN
  -- We use a single query to get all distinct values to avoid multiple round trips or complex joins
  -- However, separate queries for each distinct column is usually faster than one giant group by
  -- The previous implementation was fine, let's just ensure it's robust.
  
  SELECT json_build_object(
    'years', ARRAY(SELECT DISTINCT year::integer FROM vehicle_data WHERE year IS NOT NULL ORDER BY year::integer DESC),
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
