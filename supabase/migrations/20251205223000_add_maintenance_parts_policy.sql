-- Add RLS policies for maintenance_parts table

ALTER TABLE maintenance_parts ENABLE ROW LEVEL SECURITY;

-- Allow all operations if the user owns the vehicle associated with the maintenance log
CREATE POLICY "maintenance_parts_owner_all" ON maintenance_parts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM maintenance_log ml
      JOIN user_vehicle uv ON ml.user_vehicle_id = uv.id
      WHERE ml.id = maintenance_parts.maintenance_log_id
      AND uv.owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM maintenance_log ml
      JOIN user_vehicle uv ON ml.user_vehicle_id = uv.id
      WHERE ml.id = maintenance_parts.maintenance_log_id
      AND uv.owner_id = (SELECT auth.uid())
    )
  );
