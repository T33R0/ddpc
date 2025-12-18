-- Optimize RLS policies to address performance warnings
-- Issues addressed:
-- 1. auth_rls_initplan: Wrap auth.uid() and auth.role() in (select ...) to avoid per-row re-evaluation.
-- 2. multiple_permissive_policies: Consolidate redundant policies into single policies per action/role.
-- 3. Scope to authenticated: Restrict ownership policies to 'authenticated' role to clean up 'anon' warnings.
-- 4. Simplify joins: Use user_id column on service_intervals instead of joining user_vehicle.

-- -------------------------------------------------------------------------
-- Table: user_vehicle
-- -------------------------------------------------------------------------
-- Consolidate insert/select/update/delete self policies into one "owner_access" policy.
-- Fixes auth_rls_initplan by wrapping auth.uid().
DROP POLICY IF EXISTS "user_vehicle_insert_self" ON user_vehicle;
DROP POLICY IF EXISTS "user_vehicle_select_self" ON user_vehicle;
DROP POLICY IF EXISTS "user_vehicle_update_self" ON user_vehicle;
DROP POLICY IF EXISTS "user_vehicle_delete_self" ON user_vehicle;

CREATE POLICY "user_vehicle_owner_access"
ON user_vehicle
FOR ALL
TO authenticated
USING ((select auth.uid()) = owner_id)
WITH CHECK ((select auth.uid()) = owner_id);


-- -------------------------------------------------------------------------
-- Table: service_intervals
-- -------------------------------------------------------------------------
-- Consolidate mixed policies (some using joins, some using user_id) into one simple user_id check.
-- Fixes auth_rls_initplan and multiple_permissive_policies.
DROP POLICY IF EXISTS "service_intervals_insert_self" ON service_intervals;
DROP POLICY IF EXISTS "service_intervals_select_self" ON service_intervals;
DROP POLICY IF EXISTS "service_intervals_update_self" ON service_intervals;
DROP POLICY IF EXISTS "Enable all access for authenticated users (own intervals)" ON service_intervals;

CREATE POLICY "service_intervals_owner_access"
ON service_intervals
FOR ALL
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);


-- -------------------------------------------------------------------------
-- Table: maintenance_log
-- -------------------------------------------------------------------------
-- Consolidate policies. Must keep JOIN as user_id is not available on table.
-- Fixes auth_rls_initplan and multiple_permissive_policies.
DROP POLICY IF EXISTS "maintenance_log_insert_self" ON maintenance_log;
DROP POLICY IF EXISTS "maintenance_log_select_self" ON maintenance_log;
DROP POLICY IF EXISTS "maintenance_log_owner_all" ON maintenance_log;

CREATE POLICY "maintenance_log_owner_access"
ON maintenance_log
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_vehicle uv
    WHERE uv.id = maintenance_log.user_vehicle_id
    AND uv.owner_id = (select auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_vehicle uv
    WHERE uv.id = maintenance_log.user_vehicle_id
    AND uv.owner_id = (select auth.uid())
  )
);


-- -------------------------------------------------------------------------
-- Table: testimonials
-- -------------------------------------------------------------------------
-- Consolidate into action-based policies to handle permissions correctly and efficiently.
-- Fixes auth_rls_initplan, multiple_permissive_policies, and incorrect permission expansion.
DROP POLICY IF EXISTS "Users can insert their own testimonials" ON testimonials;
DROP POLICY IF EXISTS "Users can view their own testimonials" ON testimonials;
DROP POLICY IF EXISTS "Admins can do everything with testimonials" ON testimonials;
DROP POLICY IF EXISTS "Approved testimonials are viewable by everyone" ON testimonials;

-- Combined Select (Public: Approved OR Auth: Own/Admin)
CREATE POLICY "testimonials_select_combined"
ON testimonials
FOR SELECT
TO public
USING (
  is_approved = true OR
  (
    (select auth.role()) = 'authenticated' AND
    (
      (select auth.uid()) = user_id OR
      EXISTS (SELECT 1 FROM user_profile up WHERE up.user_id = (select auth.uid()) AND up.role = 'admin')
    )
  )
);

-- Combined Insert (Auth: Own/Admin)
CREATE POLICY "testimonials_insert_combined"
ON testimonials
FOR INSERT
TO authenticated
WITH CHECK (
  (select auth.uid()) = user_id OR
  EXISTS (SELECT 1 FROM user_profile up WHERE up.user_id = (select auth.uid()) AND up.role = 'admin')
);

-- Admin Update
CREATE POLICY "testimonials_update_admin"
ON testimonials
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_profile up WHERE up.user_id = (select auth.uid()) AND up.role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM user_profile up WHERE up.user_id = (select auth.uid()) AND up.role = 'admin')
);

-- Admin Delete
CREATE POLICY "testimonials_delete_admin"
ON testimonials
FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_profile up WHERE up.user_id = (select auth.uid()) AND up.role = 'admin')
);


-- -------------------------------------------------------------------------
-- Table: user_profile
-- -------------------------------------------------------------------------
-- Consolidate Admin and Self update policies.
-- Fixes multiple_permissive_policies.
DROP POLICY IF EXISTS "up_update_admin" ON user_profile;
DROP POLICY IF EXISTS "up_update_self" ON user_profile;

CREATE POLICY "user_profile_update_combined"
ON user_profile
FOR UPDATE
TO authenticated
USING (
  ((select auth.uid()) = user_id) OR
  (EXISTS (
    SELECT 1 FROM user_profile up
    WHERE up.user_id = (select auth.uid())
    AND up.role = 'admin'
  ))
)
WITH CHECK (
  ((select auth.uid()) = user_id) OR
  (EXISTS (
    SELECT 1 FROM user_profile up
    WHERE up.user_id = (select auth.uid())
    AND up.role = 'admin'
  ))
);


-- -------------------------------------------------------------------------
-- Table: issue_reports
-- -------------------------------------------------------------------------
-- Fix auth_rls_initplan by wrapping auth.role().
DROP POLICY IF EXISTS "Enable read for authenticated users" ON issue_reports;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON issue_reports;

CREATE POLICY "issue_reports_select_auth"
ON issue_reports
FOR SELECT
TO authenticated
USING ((select auth.role()) = 'authenticated');

CREATE POLICY "issue_reports_update_auth"
ON issue_reports
FOR UPDATE
TO authenticated
USING ((select auth.role()) = 'authenticated')
WITH CHECK ((select auth.role()) = 'authenticated');


-- -------------------------------------------------------------------------
-- Table: vehicle_data
-- -------------------------------------------------------------------------
-- Drop duplicate public read policy.
DROP POLICY IF EXISTS "read vehicle_data" ON vehicle_data;
