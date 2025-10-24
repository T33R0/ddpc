-- Add RLS policy for maintenance_log table
-- This allows users to only access maintenance logs for vehicles they own

CREATE POLICY maintenance_log_owner_all ON public.maintenance_log
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM user_vehicle uv
      WHERE (uv.id = maintenance_log.user_vehicle_id) AND (uv.owner_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_vehicle uv
      WHERE (uv.id = maintenance_log.user_vehicle_id) AND (uv.owner_id = auth.uid())
    )
  );
