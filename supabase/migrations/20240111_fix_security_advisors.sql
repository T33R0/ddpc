-- Security Fixes: Set search_path for functions to prevent hijacking
-- Advisory: Function Search Path Mutable

ALTER FUNCTION public.safe_cast_price(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_compute_health_summary(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_random_vehicles(integer) SET search_path = public, pg_temp;
