-- Fix for Explore Page Filter Dependency
-- Update get_vehicle_filter_options to return models as objects with make and model
-- This allows the frontend to filter models based on the selected make

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
    -- Return models as objects { "make": "BMW", "model": "M3" }
    'models', (
      SELECT json_agg(t) FROM (
        SELECT DISTINCT make, model 
        FROM vehicle_data 
        WHERE make IS NOT NULL AND model IS NOT NULL 
        ORDER BY make ASC, model ASC
      ) t
    ),
    'engineTypes', ARRAY(SELECT DISTINCT cylinders FROM vehicle_data WHERE cylinders IS NOT NULL ORDER BY cylinders ASC),
    'fuelTypes', ARRAY(SELECT DISTINCT fuel_type FROM vehicle_data WHERE fuel_type IS NOT NULL ORDER BY fuel_type ASC),
    'drivetrains', ARRAY(SELECT DISTINCT drive_type FROM vehicle_data WHERE drive_type IS NOT NULL ORDER BY drive_type ASC),
    'bodyTypes', ARRAY(SELECT DISTINCT body_type FROM vehicle_data WHERE body_type IS NOT NULL ORDER BY body_type ASC)
  ) INTO result;

  RETURN result;
END;
$$;
