-- Drop the function first because we are changing the return type signature
-- Drop both potential signatures to be safe (old 3-arg and new 5-arg)
DROP FUNCTION IF EXISTS get_admin_users_stats(integer, integer, text);
DROP FUNCTION IF EXISTS get_admin_users_stats(integer, integer, text, text, text);

CREATE OR REPLACE FUNCTION get_admin_users_stats(
  limit_offset int DEFAULT 0,
  limit_count int DEFAULT 20,
  search_query text DEFAULT NULL,
  sort_by text DEFAULT 'joined',
  sort_dir text DEFAULT 'desc'
)
RETURNS TABLE (
  o_user_id uuid,
  o_username text,
  o_display_name text,
  o_join_date timestamptz,
  o_email varchar,
  o_provider text,
  o_vehicle_count bigint,
  o_status_counts jsonb,
  o_role public.user_role,
  o_banned boolean,
  o_plan text,
  o_last_sign_in_at timestamptz,
  o_total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_users AS (
    SELECT 
      up.user_id,
      up.username,
      up.display_name,
      au.created_at as join_date,
      au.email::varchar as email,
      (au.raw_app_meta_data->>'provider')::text as provider,
      up.role,
      up.banned,
      COALESCE(up.plan, 'free')::text as plan,
      au.last_sign_in_at
    FROM public.user_profile up
    JOIN auth.users au ON up.user_id = au.id
    WHERE
      (search_query IS NULL OR
       up.username ILIKE '%' || search_query || '%' OR
       au.email ILIKE '%' || search_query || '%')
  ),
  vehicle_stats AS (
    SELECT
      owner_id,
      COUNT(*) as total,
      jsonb_object_agg(status, count) as status_details
    FROM (
      SELECT owner_id, COALESCE(current_status, 'unknown') as status, COUNT(*) as count
      FROM public.user_vehicle
      WHERE owner_id IN (SELECT fu.user_id FROM filtered_users fu)
      GROUP BY owner_id, current_status
    ) sub
    GROUP BY owner_id
  ),
  final_set AS (
    SELECT
      fu.user_id,
      fu.username,
      fu.display_name,
      fu.join_date,
      fu.email,
      fu.provider,
      COALESCE(vs.total, 0)::bigint as vehicle_count,
      COALESCE(vs.status_details, '{}'::jsonb) as status_counts,
      fu.role,
      fu.banned,
      fu.plan,
      fu.last_sign_in_at,
      COUNT(*) OVER() as total_count
    FROM filtered_users fu
    LEFT JOIN vehicle_stats vs ON fu.user_id = vs.owner_id
  )
  SELECT * FROM final_set
  ORDER BY
    CASE WHEN sort_dir = 'asc' THEN
      CASE 
        WHEN sort_by = 'user' THEN username
        WHEN sort_by = 'email' THEN email
        ELSE NULL
      END
    END ASC,
    CASE WHEN sort_dir = 'desc' THEN
      CASE 
        WHEN sort_by = 'user' THEN username
        WHEN sort_by = 'email' THEN email
        ELSE NULL
      END
    END DESC,
    CASE WHEN sort_dir = 'asc' THEN
      CASE 
        WHEN sort_by = 'joined' THEN join_date
        WHEN sort_by = 'login' THEN last_sign_in_at
        ELSE NULL
      END
    END ASC NULLS FIRST,
    CASE WHEN sort_dir = 'desc' THEN
      CASE 
        WHEN sort_by = 'joined' THEN join_date
        WHEN sort_by = 'login' THEN last_sign_in_at
        ELSE NULL
      END
    END DESC NULLS LAST,
    CASE WHEN sort_dir = 'asc' THEN
      CASE 
        WHEN sort_by = 'active' THEN COALESCE((status_counts->>'active')::int, 0)
        WHEN sort_by = 'total' THEN vehicle_count::int
        ELSE NULL
      END
    END ASC,
    CASE WHEN sort_dir = 'desc' THEN
      CASE 
        WHEN sort_by = 'active' THEN COALESCE((status_counts->>'active')::int, 0)
        WHEN sort_by = 'total' THEN vehicle_count::int
        ELSE NULL
      END
    END DESC
  LIMIT limit_count OFFSET limit_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_users_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_users_stats TO service_role;

