-- Fix function_search_path_mutable warnings
-- Sets a fixed search_path for functions to prevent malicious search_path manipulation.

ALTER FUNCTION public.activity_log_write SET search_path = public, extensions, pg_temp;

-- Specify arguments for get_unique_vehicles_with_trims to avoid ambiguity
ALTER FUNCTION public.get_unique_vehicles_with_trims(integer, integer, integer, integer, text, text, text, text, text, text) SET search_path = public, extensions, pg_temp;

ALTER FUNCTION public.cleanup_old_bot_sessions SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.enforce_preferred_vehicle_ownership SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.validate_plan_transition SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_vehicle_filter_options SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_vehicle_build_thread SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_user_vehicle_financials SET search_path = public, extensions, pg_temp;
ALTER FUNCTION analytics.refresh_materialized_predictive SET search_path = analytics, public, extensions, pg_temp;
ALTER FUNCTION public.tg_garage_owner_member SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.set_updated_at SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.fn_update_vehicle_last_event_at SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.prevent_admin_self_demotion SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.validate_plan_insert SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.odometer_at SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.log_user_profile_activity SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.plan_creator_for_vehicle SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.is_user_banned SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.current_odometer_for_vehicle SET search_path = public, extensions, pg_temp;
