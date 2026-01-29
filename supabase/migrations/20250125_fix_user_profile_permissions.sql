-- Fix permissions for user_profile to ensure plan column is accessible
-- This addresses an issue where client-side fetches (useAuth) would receive null for the plan column

-- 1. Explicitly grant SELECT on the table to authenticated users
-- (Postgres grants usually cover all columns, but this ensures no previous REVOKE interferes)
GRANT SELECT ON TABLE public.user_profile TO authenticated;
GRANT SELECT ON TABLE public.user_profile TO anon; -- Needed for public profiles

-- 2. Refresh the RLS Select Policy
-- We drop and recreate to ensure it is clean and active
DROP POLICY IF EXISTS "user_profile_select" ON public.user_profile;

CREATE POLICY "user_profile_select" ON public.user_profile
FOR SELECT
USING (
  (user_id = auth.uid())      -- Users can see their own profile (including plan)
  OR (is_public = true)       -- Public profiles are visible (but plan might be exposed if selected)
  OR (is_admin())             -- Admins can see everything
);

-- 3. Ensure the function 'is_admin' is accessible (it is used in the policy)
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO anon;
