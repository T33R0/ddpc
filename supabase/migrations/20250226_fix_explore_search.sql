-- Optimize Explore Search with Full Text Search (FTS)
-- This migration adds a search_vector column and index to vehicle_data for high-performance searching.

-- 1. Add search_vector column if it doesn't exist
ALTER TABLE vehicle_data ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 2. Create function to update search_vector
CREATE OR REPLACE FUNCTION vehicle_data_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    CONCAT_WS(' ',
      NEW.year,
      NEW.make,
      NEW.model,
      NEW."trim",
      NEW.trim_description,
      NEW.body_type,
      NEW.fuel_type,
      NEW.drive_type,
      NEW.cylinders,
      NEW.horsepower_hp,
      NEW.country_of_origin,
      NEW.car_classification,
      NEW.platform_code_generation,
      NEW.pros::text,
      NEW.cons::text
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create Trigger to keep search_vector updated
DROP TRIGGER IF EXISTS tsvectorupdate ON vehicle_data;
CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE ON vehicle_data
FOR EACH ROW EXECUTE FUNCTION vehicle_data_search_vector_update();

-- 4. Backfill data (update all rows to populate the new column)
-- Using a DO block to ensure it runs even if trigger was just created
DO $$
BEGIN
  UPDATE vehicle_data SET search_vector = to_tsvector('simple',
    CONCAT_WS(' ',
      year,
      make,
      model,
      "trim",
      trim_description,
      body_type,
      fuel_type,
      drive_type,
      cylinders,
      horsepower_hp,
      country_of_origin,
      car_classification,
      platform_code_generation,
      pros::text,
      cons::text
    )
  ) WHERE search_vector IS NULL;
END $$;

-- 5. Create GIN Index for fast searching
CREATE INDEX IF NOT EXISTS idx_vehicle_data_search_vector ON vehicle_data USING GIN (search_vector);

-- 6. Drop existing function signatures to ensure clean replacement
DROP FUNCTION IF EXISTS get_unique_vehicles_with_trims(integer, integer, integer, integer, text, text, text, text, text, text);
DROP FUNCTION IF EXISTS get_unique_vehicles_with_trims(integer, integer, integer, integer, text, text, text, text, text, text, text);

-- 7. Recreate function using the optimized search_vector
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
    -- Clean the search query (remove special chars that might break tsquery syntax, allow spaces)
    -- We keep alphanumeric and spaces.
    clean_search_query := regexp_replace(trim(search_query), '[^a-zA-Z0-9\s]', '', 'g');

    -- Construct TS Query for partial matching: "2008 BMW" -> "2008:* & BMW:*"
    SELECT string_agg(token || ':*', ' & ')::tsquery
    INTO ts_query
    FROM unnest(string_to_array(clean_search_query, ' ')) AS token
    WHERE token <> '';
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
      -- Search Logic using GIN Index
      AND (
        ts_query IS NULL OR
        vd.search_vector @@ ts_query
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
