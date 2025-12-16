-- Optimize Explore Search: Core Attributes & Robust Combinations
-- Replaces previous FTS implementation with a lightweight, functional GIN index approach.
-- Focuses only on core attributes (Year, Make, Model, Engine, MPG, etc.) to ensure performance.

-- 1. Cleanup previous objects to ensure clean slate
DROP INDEX IF EXISTS idx_vehicle_data_fts;
DROP INDEX IF EXISTS idx_vehicle_data_fts_expr;
DROP FUNCTION IF EXISTS get_vehicle_tsvector(vehicle_data);
ALTER TABLE vehicle_data DROP COLUMN IF EXISTS search_vector;
DROP TRIGGER IF EXISTS tsvectorupdate ON vehicle_data;
DROP FUNCTION IF EXISTS vehicle_data_search_vector_update();

-- 2. Create IMMUTABLE helper function for the index
-- Concatenates CORE attributes only. Adds units/suffixes to aid natural language search (e.g. "2.0L", "6cyl").
CREATE OR REPLACE FUNCTION get_vehicle_tsvector(vd vehicle_data)
RETURNS tsvector
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN to_tsvector('simple',
    CONCAT_WS(' ',
      vd.year::text,
      vd.make,
      vd.model,
      vd."trim",
      vd.trim_description,
      vd.body_type,
      vd.engine_size_l::text,
      CASE WHEN vd.engine_size_l IS NOT NULL THEN vd.engine_size_l::text || 'L' END,
      vd.cylinders::text,
      CASE WHEN vd.cylinders IS NOT NULL THEN vd.cylinders::text || 'cyl' END,
      CASE WHEN vd.cylinders IS NOT NULL THEN vd.cylinders::text || 'cylinders' END,
      vd.total_seating::text,
      CASE WHEN vd.total_seating IS NOT NULL THEN vd.total_seating::text || 'seats' END,
      vd.epa_combined_mpg::text,
      CASE WHEN vd.epa_combined_mpg IS NOT NULL THEN vd.epa_combined_mpg::text || 'mpg' END,
      vd.epa_city_highway_mpg::text,
      vd.country_of_origin,
      vd.drive_type,
      vd.transmission,
      vd.fuel_type,
      vd.doors::text,
      CASE WHEN vd.doors IS NOT NULL THEN vd.doors::text || 'doors' END,
      vd.car_classification,
      vd.platform_code_generation
    )
  );
END;
$$;

-- 3. Create GIN Index on the function result
-- This avoids modifying the table (no backfill timeout risks on table lock),
-- but still provides indexed search speed.
CREATE INDEX idx_vehicle_data_fts
ON vehicle_data
USING GIN (get_vehicle_tsvector(vehicle_data));

-- 4. Recreate main query function with Robust Search Logic
DROP FUNCTION IF EXISTS get_unique_vehicles_with_trims(integer, integer, integer, integer, text, text, text, text, text, text);
DROP FUNCTION IF EXISTS get_unique_vehicles_with_trims(integer, integer, integer, integer, text, text, text, text, text, text, text);

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
DECLARE
  ts_query tsquery;
  clean_search_query text;
BEGIN
  -- Handle Search Query
  IF search_query IS NOT NULL AND trim(search_query) <> '' THEN
    -- 1. Clean: Allow alphanumeric, hyphens, and dots (for 2.0L), remove others.
    clean_search_query := regexp_replace(trim(search_query), '[^a-zA-Z0-9\-\.]', ' ', 'g');

    -- 2. Normalize spaces
    clean_search_query := regexp_replace(clean_search_query, '\s+', ' ', 'g');
    clean_search_query := trim(clean_search_query);

    -- 3. Construct TS Query: Split by space, append :* for prefix matching, join with & (AND)
    -- This enforces that "2020 BMW" matches only if both are present.
    IF clean_search_query <> '' THEN
      SELECT string_agg(token || ':*', ' & ')::tsquery
      INTO ts_query
      FROM unnest(string_to_array(clean_search_query, ' ')) AS token
      WHERE token <> '';
    END IF;
  END IF;

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
      -- Search Logic using Functional Index
      AND (
        ts_query IS NULL OR
        get_vehicle_tsvector(vd) @@ ts_query
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
    rv.year::text,
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
        'country_of_origin', rv.country_of_origin,
        'car_classification', rv.car_classification,
        'platform_code_generation', rv.platform_code_generation,
        'epa_combined_mpg', rv.epa_combined_mpg,
        'epa_city_highway_mpg', rv.epa_city_highway_mpg,
        'total_seating', rv.total_seating
      ) ORDER BY rv."trim" ASC
    ) AS trims
  FROM relevant_vehicles rv
  LEFT JOIN images i ON i.vehicle_id = rv.id
  GROUP BY rv.year, rv.make, rv.model
  ORDER BY rv.year DESC, rv.make ASC, rv.model ASC;
END;
$$;
