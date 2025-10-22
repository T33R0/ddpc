-- Fix RLS Policies for user_profile table
-- Run this in Supabase SQL editor to fix the profile creation issue

-- Create user role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'helper', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop the old restrictive policy if it exists
DROP POLICY IF EXISTS up_insert_self ON public.user_profile;

-- Create a more permissive policy for initial profile creation
CREATE POLICY up_insert_self ON public.user_profile
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add preferred_vehicle_id column to user_profile table
ALTER TABLE public.user_profile
ADD COLUMN IF NOT EXISTS preferred_vehicle_id UUID REFERENCES public.user_vehicle(id);

-- Vehicle aggregation functions for DDPC discover page
-- These functions need to be created in Supabase SQL editor

-- Function to get unique vehicles with all their trims (with filtering)
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
AS $$
BEGIN
  RETURN QUERY
  SELECT
    CONCAT(vd.year, '-', vd.make, '-', vd.model) as id,
    vd.make,
    vd.model,
    vd.year,
    COALESCE((
      SELECT vpi.url FROM vehicle_primary_image vpi
      WHERE vpi.vehicle_id = vd.id
      LIMIT 1
    ), '') as hero_image,
    jsonb_agg(
      jsonb_build_object(
        'id', vd.id,
        'trim', vd."trim",
        'trim_description', vd.trim_description,
        'image_url', COALESCE((
          SELECT vpi2.url FROM vehicle_primary_image vpi2
          WHERE vpi2.vehicle_id = vd.id
          LIMIT 1
        ), ''),
        'body_type', vd.body_type,
        'fuel_type', vd.fuel_type,
        'transmission', vd.transmission,
        'drive_type', vd.drive_type,
        'curb_weight_lbs', vd.curb_weight_lbs,
        'cylinders', vd.cylinders,
        'engine_size_l', vd.engine_size_l,
        'horsepower_hp', vd.horsepower_hp,
        'horsepower_rpm', vd.horsepower_rpm,
        'torque_ft_lbs', vd.torque_ft_lbs,
        'torque_rpm', vd.torque_rpm,
        'epa_combined_mpg', vd.epa_combined_mpg,
        'length_in', vd.length_in,
        'width_in', vd.width_in,
        'height_in', vd.height_in,
        'wheelbase_in', vd.wheelbase_in,
        'front_track_in', vd.front_track_in,
        'rear_track_in', vd.rear_track_in,
        'ground_clearance_in', vd.ground_clearance_in
      )
      ORDER BY vd."trim" ASC
    ) as trims
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

-- Enable RLS on mods table first (if not already enabled)
ALTER TABLE public.mods ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for mods table
DROP POLICY IF EXISTS mods_owner_all ON public.mods;
CREATE POLICY mods_owner_all ON public.mods
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_vehicle uv
      WHERE uv.id = mods.user_vehicle_id
      AND uv.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_vehicle uv
      WHERE uv.id = mods.user_vehicle_id
      AND uv.owner_id = auth.uid()
    )
  );

-- Add preferred_vehicle_id column to user_profile table
ALTER TABLE public.user_profile
ADD COLUMN IF NOT EXISTS preferred_vehicle_id UUID REFERENCES public.user_vehicle(id);