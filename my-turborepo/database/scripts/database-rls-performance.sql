-- RLS performance remediation script
-- Applies the Supabase recommendations from lint findings:
--   * Wrap auth.<fn>() calls inside SELECT to avoid per-row re-evaluation
--   * Consolidate redundant permissive policies so each role/action is evaluated once
--
-- Run this script inside the Supabase SQL editor or psql against the primary
-- database. It is idempotent and can be re-applied safely.

BEGIN;

------------------------------------------------------------------------------
-- 1. Stabilize owner-scoped policies by caching auth.uid() via subselects.
------------------------------------------------------------------------------

ALTER POLICY "Enable all access for authenticated users (own fuel logs)" ON public.fuel_log
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

ALTER POLICY "Enable all access for authenticated users (own intervals)" ON public.service_intervals
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

ALTER POLICY "Enable all access for authenticated users (own parts)" ON public.part_inventory
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

ALTER POLICY "Users can manage their own job plans" ON public.job_plans
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

ALTER POLICY "Users can manage steps for their own job plans" ON public.job_steps
  USING (
    EXISTS (
      SELECT 1
      FROM public.job_plans jp
      WHERE jp.id = job_steps.job_plan_id
        AND jp.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.job_plans jp
      WHERE jp.id = job_steps.job_plan_id
        AND jp.user_id = (SELECT auth.uid())
    )
  );

ALTER POLICY maintenance_log_owner_all ON public.maintenance_log
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_vehicle uv
      WHERE uv.id = maintenance_log.user_vehicle_id
        AND uv.owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_vehicle uv
      WHERE uv.id = maintenance_log.user_vehicle_id
        AND uv.owner_id = (SELECT auth.uid())
    )
  );

ALTER POLICY mods_owner_all ON public.mods
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_vehicle uv
      WHERE uv.id = mods.user_vehicle_id
        AND uv.owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_vehicle uv
      WHERE uv.id = mods.user_vehicle_id
        AND uv.owner_id = (SELECT auth.uid())
    )
  );

ALTER POLICY "Enable all access for authenticated users (own mod parts)" ON public.mod_parts
  USING (
    EXISTS (
      SELECT 1
      FROM public.mods m
      JOIN public.user_vehicle uv ON uv.id = m.user_vehicle_id
      WHERE m.id = mod_parts.mod_id
        AND uv.owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.mods m
      JOIN public.user_vehicle uv ON uv.id = m.user_vehicle_id
      WHERE m.id = mod_parts.mod_id
        AND uv.owner_id = (SELECT auth.uid())
    )
  );

ALTER POLICY mod_outcome_owner_all ON public.mod_outcome
  USING (
    EXISTS (
      SELECT 1
      FROM public.mods m
      JOIN public.user_vehicle uv ON uv.id = m.user_vehicle_id
      WHERE m.id = mod_outcome.mod_id
        AND uv.owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.mods m
      JOIN public.user_vehicle uv ON uv.id = m.user_vehicle_id
      WHERE m.id = mod_outcome.mod_id
        AND uv.owner_id = (SELECT auth.uid())
    )
  );

ALTER POLICY odolog_owner_all ON public.odometer_log
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_vehicle uv
      WHERE uv.id = odometer_log.user_vehicle_id
        AND uv.owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_vehicle uv
      WHERE uv.id = odometer_log.user_vehicle_id
        AND uv.owner_id = (SELECT auth.uid())
    )
  );

------------------------------------------------------------------------------
-- 2. Issue reports & activity log: wrap auth.* and scope service policies.
------------------------------------------------------------------------------

ALTER POLICY "Enable read for authenticated users" ON public.issue_reports
  USING ((SELECT auth.role()) = 'authenticated'::text);

ALTER POLICY "Enable update for authenticated users" ON public.issue_reports
  USING ((SELECT auth.role()) = 'authenticated'::text);

ALTER POLICY activity_log_select_own ON public.activity_log
  USING (user_id = (SELECT auth.uid()));

ALTER POLICY activity_log_insert_own ON public.activity_log
  WITH CHECK (user_id = (SELECT auth.uid()));

ALTER POLICY activity_log_service_all ON public.activity_log
  TO service_role
  USING (true)
  WITH CHECK (true);

------------------------------------------------------------------------------
-- 3. Service-only helper tables: rely on role scoping instead of auth.role().
------------------------------------------------------------------------------

ALTER POLICY vpi_insert_service_only ON public.vehicle_primary_image
  TO service_role
  WITH CHECK (true);

ALTER POLICY vpi_update_service_only ON public.vehicle_primary_image
  TO service_role
  USING (true)
  WITH CHECK (true);

ALTER POLICY vpi_delete_service_only ON public.vehicle_primary_image
  TO service_role
  USING (true);

ALTER POLICY via_insert_service_only ON public.vehicle_image_archive
  TO service_role
  WITH CHECK (true);

ALTER POLICY via_update_service_only ON public.vehicle_image_archive
  TO service_role
  USING (true)
  WITH CHECK (true);

ALTER POLICY via_delete_service_only ON public.vehicle_image_archive
  TO service_role
  USING (true);

ALTER POLICY vuq_service_only_all ON public.vehicle_url_queue
  TO service_role
  USING (true)
  WITH CHECK (true);

------------------------------------------------------------------------------
-- 4. Consolidate job template policies to remove duplicate SELECT plans.
------------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public templates are viewable" ON public.job_templates;
DROP POLICY IF EXISTS "Users can manage their own job templates" ON public.job_templates;
DROP POLICY IF EXISTS job_templates_select_combined ON public.job_templates;
DROP POLICY IF EXISTS job_templates_insert_self ON public.job_templates;
DROP POLICY IF EXISTS job_templates_update_self ON public.job_templates;
DROP POLICY IF EXISTS job_templates_delete_self ON public.job_templates;

CREATE POLICY job_templates_select_combined ON public.job_templates
  FOR SELECT
  USING (is_public = true OR user_id = (SELECT auth.uid()));

CREATE POLICY job_templates_insert_self ON public.job_templates
  FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY job_templates_update_self ON public.job_templates
  FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY job_templates_delete_self ON public.job_templates
  FOR DELETE
  USING (user_id = (SELECT auth.uid()));

------------------------------------------------------------------------------
-- 5. Consolidate job_template_steps policies (single SELECT + scoped writes).
------------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public template steps are viewable" ON public.job_template_steps;
DROP POLICY IF EXISTS "Users can manage steps for their own templates" ON public.job_template_steps;
DROP POLICY IF EXISTS job_template_steps_select_combined ON public.job_template_steps;
DROP POLICY IF EXISTS job_template_steps_insert_self ON public.job_template_steps;
DROP POLICY IF EXISTS job_template_steps_update_self ON public.job_template_steps;
DROP POLICY IF EXISTS job_template_steps_delete_self ON public.job_template_steps;

CREATE POLICY job_template_steps_select_combined ON public.job_template_steps
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.job_templates jt
      WHERE jt.id = job_template_steps.job_template_id
        AND (
          jt.is_public = true
          OR jt.user_id = (SELECT auth.uid())
        )
    )
  );

CREATE POLICY job_template_steps_insert_self ON public.job_template_steps
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.job_templates jt
      WHERE jt.id = job_template_steps.job_template_id
        AND jt.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY job_template_steps_update_self ON public.job_template_steps
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.job_templates jt
      WHERE jt.id = job_template_steps.job_template_id
        AND jt.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.job_templates jt
      WHERE jt.id = job_template_steps.job_template_id
        AND jt.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY job_template_steps_delete_self ON public.job_template_steps
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.job_templates jt
      WHERE jt.id = job_template_steps.job_template_id
        AND jt.user_id = (SELECT auth.uid())
    )
  );

------------------------------------------------------------------------------
-- 6. Rebuild user_vehicle policies (single SELECT + scoped writes).
------------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can manage their own vehicles" ON public.user_vehicle;
DROP POLICY IF EXISTS "Users can view their own vehicles" ON public.user_vehicle;
DROP POLICY IF EXISTS "public read vehicles with privacy=public" ON public.user_vehicle;
DROP POLICY IF EXISTS vehicle_select_public ON public.user_vehicle;
DROP POLICY IF EXISTS user_vehicle_select_combined ON public.user_vehicle;
DROP POLICY IF EXISTS user_vehicle_insert_self ON public.user_vehicle;
DROP POLICY IF EXISTS user_vehicle_update_self ON public.user_vehicle;
DROP POLICY IF EXISTS user_vehicle_delete_self ON public.user_vehicle;

CREATE POLICY user_vehicle_select_combined ON public.user_vehicle
  FOR SELECT
  USING (
    privacy = 'public'::text
    OR owner_id = (SELECT auth.uid())
  );

CREATE POLICY user_vehicle_insert_self ON public.user_vehicle
  FOR INSERT
  WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY user_vehicle_update_self ON public.user_vehicle
  FOR UPDATE
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY user_vehicle_delete_self ON public.user_vehicle
  FOR DELETE
  USING (owner_id = (SELECT auth.uid()));

------------------------------------------------------------------------------
-- 7. De-duplicate vehicle_data read policies.
------------------------------------------------------------------------------

DROP POLICY IF EXISTS vd_read ON public.vehicle_data;

ALTER POLICY "read vehicle_data" ON public.vehicle_data
  USING (true);

------------------------------------------------------------------------------
-- 8. User profile policies: drop redundant SELECT policies and wrap auth.*
------------------------------------------------------------------------------

DROP POLICY IF EXISTS up_read_public ON public.user_profile;
DROP POLICY IF EXISTS up_read_self ON public.user_profile;
DROP POLICY IF EXISTS up_select_self ON public.user_profile;
DROP POLICY IF EXISTS zz_combined_select ON public.user_profile;
DROP POLICY IF EXISTS up_select_combined ON public.user_profile;

CREATE POLICY up_select_combined ON public.user_profile
  FOR SELECT
  USING (is_public = true OR user_id = (SELECT auth.uid()));

ALTER POLICY up_insert_self ON public.user_profile
  WITH CHECK (user_id = (SELECT auth.uid()));

ALTER POLICY up_update_self ON public.user_profile
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

ALTER POLICY up_update_admin ON public.user_profile
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profile up_admin
      WHERE up_admin.user_id = (SELECT auth.uid())
        AND up_admin.role = 'admin'::user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_profile up_admin
      WHERE up_admin.user_id = (SELECT auth.uid())
        AND up_admin.role = 'admin'::user_role
    )
  );

ALTER POLICY up_service_all ON public.user_profile
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;

