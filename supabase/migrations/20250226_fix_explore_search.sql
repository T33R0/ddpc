-- Optimize Explore Search with Functional GIN Index
-- Strategies:
-- 1. Functional Index (prevents backfill timeouts, solves immutability check)
-- 2. Cleanup Order (prevents dependency errors)
-- 3. Explicit Casting (prevents type errors)

-- 1. Cleanup previous attempts (Ordered for safety)
DROP INDEX IF EXISTS idx_vehicle_data_fts_expr; -- From v7/v8 attempt
DROP INDEX IF EXISTS idx_vehicle_data_fts;      -- From v6 attempt

-- Now safe to drop the function
DROP FUNCTION IF EXISTS get_vehicle_tsvector(vehicle_data);

-- Cleanup column-based attempts (v4/v5)
ALTER TABLE vehicle_data DROP COLUMN IF EXISTS search_vector;
DROP TRIGGER IF EXISTS tsvectorupdate ON vehicle_data;
DROP FUNCTION IF EXISTS vehicle_data_search_vector_update();

-- 2. Create IMMUTABLE helper function for the index
-- We mark it IMMUTABLE because we use a fixed 'simple' config and deterministic concatenation.
-- This allows us to index it.
CREATE OR REPLACE FUNCTION get_vehicle_tsvector(vd vehicle_data)
RETURNS tsvector
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN to_tsvector('simple',
    CONCAT_WS(' ',
      vd.year::text,
      vd.make::text,
      vd.model::text,
      vd."trim"::text,
      vd.trim_description::text,
      vd.body_type::text,
      vd.fuel_type::text,
      vd.drive_type::text,
      vd.cylinders::text,
      vd.horsepower_hp::text,
      vd.country_of_origin::text,
      vd.car_classification::text,
      vd.platform_code_generation::text,
      vd.pros::text,
      vd.cons::text
    )
  );
END;
$$;

-- 3. Create GIN Index on the function result
CREATE INDEX IF NOT EXISTS idx_vehicle_data_fts
ON vehicle_data
USING GIN (get_vehicle_tsvector(vehicle_data));

-- 4. Drop existing function signatures
DROP FUNCTION IF EXISTS get_unique_vehicles_with_trims(integer, integer, integer, integer, text, text, text, text, text, text);
DROP FUNCTION IF EXISTS get_unique_vehicles_with_trims(integer, integer, integer, integer, text, text, text, text, text, text, text);

-- 5. Recreate main query function
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
  -- Handle empty search
  IF search_query IS NOT NULL AND trim(search_query) <> '' THEN
    -- Clean the search query
    -- Replace non-alphanumeric/hyphen with space
    clean_search_query := regexp_replace(trim(search_query), '[^a-zA-Z0-9\-\s]', ' ', 'g');

    -- Normalize spaces
    clean_search_query := regexp_replace(clean_search_query, '\s+', ' ', 'g');
    clean_search_query := trim(clean_search_query);

    -- Construct TS Query
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
