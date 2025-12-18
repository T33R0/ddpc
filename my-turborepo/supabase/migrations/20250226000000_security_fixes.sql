-- Fix security warnings and errors

-- 1. Fix 'security_definer_view' error for v_vehicle_data_typed
-- Changing to security_invoker = true enforces RLS of the querying user.
ALTER VIEW IF EXISTS public.v_vehicle_data_typed SET (security_invoker = true);

-- 2. Fix 'materialized_view_in_api' warning for mv_vehicle_filter_options
-- Revoke access from API roles since it is not intended for direct public access.
REVOKE ALL ON MATERIALIZED VIEW public.mv_vehicle_filter_options FROM anon, authenticated;

-- 3. Fix 'function_search_path_mutable' warnings
-- Explicitly set search_path to public for security definer functions or just general hygiene.

ALTER FUNCTION public.get_vehicle_countries() SET search_path = public;

ALTER FUNCTION public.get_maintenance_due_vehicles() SET search_path = public;

-- Function signature from database-performance-fix_v2.sql
ALTER FUNCTION public.get_unique_vehicles_with_trims(
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
) SET search_path = public;

-- 4. Fix 'function_search_path_mutable' for get_vehicle_tsvector dynamically
-- Since the signature is not in the codebase, we use a DO block to find and alter it.
DO $$
DECLARE
    func_record record;
BEGIN
    FOR func_record IN
        SELECT oid::regprocedure::text as func_signature
        FROM pg_proc
        WHERE proname = 'get_vehicle_tsvector'
        AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE format('ALTER FUNCTION %s SET search_path = public', func_record.func_signature);
    END LOOP;
END $$;
