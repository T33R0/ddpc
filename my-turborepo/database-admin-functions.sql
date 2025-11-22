-- Admin function to get users with stats
-- This function runs with SECURITY DEFINER to access auth.users

CREATE OR REPLACE FUNCTION get_admin_users_stats(
  limit_offset int DEFAULT 0,
  limit_count int DEFAULT 20,
  search_query text DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  join_date timestamptz,
  email varchar,
  provider text,
  vehicle_count bigint,
  status_counts jsonb,
  role public.user_role,
  banned boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  WITH vehicle_stats AS (
    SELECT
      owner_id,
      COUNT(*) as total,
      jsonb_object_agg(status, count) as status_details
    FROM (
      SELECT owner_id, COALESCE(current_status, 'unknown') as status, COUNT(*) as count
      FROM public.user_vehicle
      GROUP BY owner_id, current_status
    ) sub
    GROUP BY owner_id
  )
  SELECT
    up.user_id,
    up.username,
    up.display_name,
    au.created_at as join_date,
    au.email::varchar,
    (au.raw_app_meta_data->>'provider')::text as provider,
    COALESCE(vs.total, 0) as vehicle_count,
    COALESCE(vs.status_details, '{}'::jsonb) as status_counts,
    up.role,
    up.banned
  FROM public.user_profile up
  JOIN auth.users au ON up.user_id = au.id
  LEFT JOIN vehicle_stats vs ON up.user_id = vs.owner_id
  WHERE
    (search_query IS NULL OR 
     up.username ILIKE '%' || search_query || '%' OR 
     au.email ILIKE '%' || search_query || '%')
  ORDER BY au.created_at DESC
  LIMIT limit_count OFFSET limit_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_users_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_users_stats TO service_role;

-- Fix for 500 Error: Create missing activity_log table
-- This table is likely referenced by a trigger on user_profile or auth.users
CREATE TABLE IF NOT EXISTS public.activity_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    action text,
    entity_type text,
    entity_id text,
    details jsonb,
    ip_address text,
    created_at timestamptz DEFAULT now()
);

-- Grant permissions
GRANT ALL ON public.activity_log TO service_role;
GRANT ALL ON public.activity_log TO postgres;
GRANT INSERT ON public.activity_log TO authenticated; 
