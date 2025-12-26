-- Fix RLS policies on user_profile to prevent access issues and infinite recursion
-- This migration drops ALL potentially conflicting policies and recreates a clean set

-- 1. Ensure the is_admin function exists and is secure
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_profile
    WHERE user_id = auth.uid()
    AND role::text = 'admin'
  );
$$;

-- 2. Drop ALL known potential policies (legacy and recent) patterns
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profile;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profile;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.user_profile;
DROP POLICY IF EXISTS "up_update_admin" ON public.user_profile;
DROP POLICY IF EXISTS "view_own_profile" ON public.user_profile;
DROP POLICY IF EXISTS "view_all_profiles_admin" ON public.user_profile;
DROP POLICY IF EXISTS "view_public_profiles" ON public.user_profile;
DROP POLICY IF EXISTS "update_own_profile" ON public.user_profile;
DROP POLICY IF EXISTS "update_any_profile_admin" ON public.user_profile;
DROP POLICY IF EXISTS "insert_own_profile" ON public.user_profile;
DROP POLICY IF EXISTS "user_profile_select" ON public.user_profile;

-- 3. Explicitly Grant Permissions
GRANT SELECT, UPDATE, INSERT ON TABLE public.user_profile TO authenticated;
GRANT SELECT ON TABLE public.user_profile TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO anon;

-- 4. Re-create policies with strict, clean checks

-- SELECT: Users can see their own profile
CREATE POLICY "user_profile_select_own" ON public.user_profile
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- SELECT: Admins can see all profiles
CREATE POLICY "user_profile_select_admin" ON public.user_profile
FOR SELECT
TO authenticated
USING (is_admin());

-- SELECT: Public profiles are visible to everyone (including anon)
CREATE POLICY "user_profile_select_public" ON public.user_profile
FOR SELECT
USING (is_public = true);

-- UPDATE: Users can update their own profile
-- CRITICAL: This MUST NOT query user_profile recursively in the CHECK
CREATE POLICY "user_profile_update_own" ON public.user_profile
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- UPDATE: Admins can update any profile
CREATE POLICY "user_profile_update_admin" ON public.user_profile
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- INSERT: Users can insert their own profile
CREATE POLICY "user_profile_insert_own" ON public.user_profile
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
