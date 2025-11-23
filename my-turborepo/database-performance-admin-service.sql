-- Performance patch for admin issues + vehicle service views
-- Addresses Supabase Performance Advisor warnings from Nov 23 2025.

BEGIN;

-- Issue reports table (admin console)
CREATE INDEX IF NOT EXISTS issue_reports_resolved_created_at_idx
  ON public.issue_reports (resolved, created_at DESC);
CREATE INDEX IF NOT EXISTS issue_reports_created_at_idx
  ON public.issue_reports (created_at DESC);

-- Activity & fuel logs
CREATE INDEX IF NOT EXISTS activity_log_user_id_idx
  ON public.activity_log (user_id);
CREATE INDEX IF NOT EXISTS fuel_log_user_id_idx
  ON public.fuel_log (user_id);
CREATE INDEX IF NOT EXISTS fuel_log_user_vehicle_id_idx
  ON public.fuel_log (user_vehicle_id);

-- Job planning tables
CREATE INDEX IF NOT EXISTS job_plans_maintenance_log_id_idx
  ON public.job_plans (maintenance_log_id);
CREATE INDEX IF NOT EXISTS job_plans_mod_log_id_idx
  ON public.job_plans (mod_log_id);
CREATE INDEX IF NOT EXISTS job_plans_user_id_idx
  ON public.job_plans (user_id);
CREATE INDEX IF NOT EXISTS job_steps_job_plan_id_idx
  ON public.job_steps (job_plan_id);
CREATE INDEX IF NOT EXISTS job_template_steps_template_id_idx
  ON public.job_template_steps (job_template_id);
CREATE INDEX IF NOT EXISTS job_templates_mod_item_id_idx
  ON public.job_templates (mod_item_id);
CREATE INDEX IF NOT EXISTS job_templates_service_item_id_idx
  ON public.job_templates (service_item_id);
CREATE INDEX IF NOT EXISTS job_templates_user_id_idx
  ON public.job_templates (user_id);

-- Maintenance + mods
CREATE INDEX IF NOT EXISTS maintenance_log_user_vehicle_status_event_idx
  ON public.maintenance_log (user_vehicle_id, status, event_date DESC);
CREATE INDEX IF NOT EXISTS maintenance_log_service_interval_id_idx
  ON public.maintenance_log (service_interval_id);
CREATE INDEX IF NOT EXISTS maintenance_log_service_item_id_idx
  ON public.maintenance_log (service_item_id);
CREATE INDEX IF NOT EXISTS maintenance_parts_log_id_idx
  ON public.maintenance_parts (maintenance_log_id);
CREATE INDEX IF NOT EXISTS maintenance_parts_part_id_idx
  ON public.maintenance_parts (part_id);
CREATE INDEX IF NOT EXISTS mod_parts_part_id_idx
  ON public.mod_parts (part_id);
CREATE INDEX IF NOT EXISTS mods_mod_item_id_idx
  ON public.mods (mod_item_id);
CREATE INDEX IF NOT EXISTS mods_user_vehicle_id_idx
  ON public.mods (user_vehicle_id);
CREATE INDEX IF NOT EXISTS odometer_log_user_vehicle_id_idx
  ON public.odometer_log (user_vehicle_id);

-- Inventory + service intervals
CREATE INDEX IF NOT EXISTS part_inventory_user_id_idx
  ON public.part_inventory (user_id);
CREATE INDEX IF NOT EXISTS service_intervals_user_vehicle_id_idx
  ON public.service_intervals (user_vehicle_id);
CREATE INDEX IF NOT EXISTS service_intervals_user_id_idx
  ON public.service_intervals (user_id);

COMMIT;


