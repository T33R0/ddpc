-- Fix RLS policies on user_profile to prevent infinite recursion
-- This migration drops existing policies and recreates them using a clean, non-recursive approach

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

-- 2. Drop potentially problematic policies
-- We attempt to drop known policies. If others exist, they might still cause issues,
-- but we target the common ones causing recursion.
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profile;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profile;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.user_profile;
DROP POLICY IF EXISTS up_update_admin ON public.user_profile;

-- 3. Re-create policies with strict, non-recursive checks

-- SELECT: Users can see their own profile
CREATE POLICY "view_own_profile" ON public.user_profile
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- SELECT: Admins can see all profiles (using SECURITY DEFINER function to avoid recursion)
CREATE POLICY "view_all_profiles_admin" ON public.user_profile
FOR SELECT
TO authenticated
USING (is_admin());

-- SELECT: Public profiles are visible to everyone
-- (Optional: If you want public profiles to be visible to unauthenticated users)
CREATE POLICY "view_public_profiles" ON public.user_profile
FOR SELECT
TO public
USING (is_public = true);

-- UPDATE: Users can update their own profile
-- CRITICAL: This MUST NOT query user_profile in the USING/CHECK clause other than checking the ID
CREATE POLICY "update_own_profile" ON public.user_profile
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- UPDATE: Admins can update any profile
CREATE POLICY "update_any_profile_admin" ON public.user_profile
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- INSERT: Handled by triggers usually, but if needed:
CREATE POLICY "insert_own_profile" ON public.user_profile
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
