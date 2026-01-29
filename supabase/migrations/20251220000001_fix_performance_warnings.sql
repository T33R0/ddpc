-- Fix RLS performance warnings by consolidating policies and wrapping auth calls

-- 1. Consolidate user_profile policies
-- Drop existing redundant policies
DROP POLICY IF EXISTS "insert_own_profile" ON public.user_profile;
DROP POLICY IF EXISTS "up_insert_self" ON public.user_profile;
DROP POLICY IF EXISTS "up_select_combined" ON public.user_profile;
DROP POLICY IF EXISTS "update_any_profile_admin" ON public.user_profile;
DROP POLICY IF EXISTS "update_own_profile" ON public.user_profile;
DROP POLICY IF EXISTS "user_profile_update_combined" ON public.user_profile;
DROP POLICY IF EXISTS "view_all_profiles_admin" ON public.user_profile;
DROP POLICY IF EXISTS "view_own_profile" ON public.user_profile;
DROP POLICY IF EXISTS "view_public_profiles" ON public.user_profile;
-- Also drop any others mentioned in potential previous migrations to be safe
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profile;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profile;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.user_profile;
DROP POLICY IF EXISTS "up_update_admin" ON public.user_profile;

-- Create unified optimized policies
-- SELECT: Users can see their own, public profiles, or if admin
CREATE POLICY "user_profile_select" ON public.user_profile
FOR SELECT
USING (
  (user_id = (SELECT auth.uid()))
  OR (is_public = true)
  OR (is_admin())
);

-- UPDATE: Users can update their own, or admins can update any
CREATE POLICY "user_profile_update" ON public.user_profile
FOR UPDATE
USING (
  (user_id = (SELECT auth.uid()))
  OR (is_admin())
);

-- INSERT: Users can insert their own (Admin insert usually handled via triggers or service role, but allowing auth.uid match is standard)
CREATE POLICY "user_profile_insert" ON public.user_profile
FOR INSERT
WITH CHECK (
  (user_id = (SELECT auth.uid()))
);


-- 2. Consolidate testimonials policies
-- Drop existing redundant policies
DROP POLICY IF EXISTS "Admins can do everything with testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Approved testimonials are viewable by everyone" ON public.testimonials;
DROP POLICY IF EXISTS "Users can insert their own testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Users can view their own testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "testimonials_delete_admin" ON public.testimonials;
DROP POLICY IF EXISTS "testimonials_insert_combined" ON public.testimonials;
DROP POLICY IF EXISTS "testimonials_select_combined" ON public.testimonials;
DROP POLICY IF EXISTS "testimonials_update_admin" ON public.testimonials;

-- Create unified optimized policies
-- SELECT: Approved, own, or admin
CREATE POLICY "testimonials_select" ON public.testimonials
FOR SELECT
USING (
  (is_approved = true)
  OR (user_id = (SELECT auth.uid()))
  OR (is_admin())
);

-- INSERT: Own or admin
CREATE POLICY "testimonials_insert" ON public.testimonials
FOR INSERT
WITH CHECK (
  (user_id = (SELECT auth.uid()))
  OR (is_admin())
);

-- UPDATE: Admin only (as requested)
CREATE POLICY "testimonials_update" ON public.testimonials
FOR UPDATE
USING (is_admin());

-- DELETE: Admin only (as requested)
CREATE POLICY "testimonials_delete" ON public.testimonials
FOR DELETE
USING (is_admin());
