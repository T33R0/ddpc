-- 1. Create Materialized View for Vehicle Filter Options
-- This pre-calculates the heavy aggregation to prevent timeouts
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_vehicle_filter_options AS
SELECT json_build_object(
    'years', ARRAY(SELECT DISTINCT year FROM vehicle_data WHERE year IS NOT NULL ORDER BY year DESC),
    'makes', ARRAY(SELECT DISTINCT make FROM vehicle_data WHERE make IS NOT NULL ORDER BY make ASC),
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
) AS options;

-- 2. Create unique index for fast access
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_vehicle_filters ON public.mv_vehicle_filter_options ((1));

-- 3. Replace the slow function with one that reads from the materialized view
CREATE OR REPLACE FUNCTION public.get_vehicle_filter_options()
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT options FROM public.mv_vehicle_filter_options LIMIT 1;
$$;

-- 4. Fix "Zombie Function" referencing wrong table name
-- Was referencing 'vehicle', should be 'user_vehicle'
CREATE OR REPLACE FUNCTION public.fn_update_vehicle_last_event_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
begin
  update public.user_vehicle
  set last_event_at = greatest(coalesce(last_event_at, to_timestamp(0)), new.created_at)
  where id = new.vehicle_id;
  return new;
end;
$function$;
