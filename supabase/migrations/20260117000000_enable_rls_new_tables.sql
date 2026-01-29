-- 1. master_parts
-- Assuming this is a shared catalog similar to master_parts_list
ALTER TABLE IF EXISTS master_parts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON master_parts;
CREATE POLICY "Enable read access for all users" ON master_parts 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON master_parts;
CREATE POLICY "Enable insert for authenticated users" ON master_parts 
    FOR INSERT TO authenticated WITH CHECK (true);

-- 2. inventory
-- Links to vehicle via vehicle_id
ALTER TABLE IF EXISTS inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage inventory for their vehicles" ON inventory;
CREATE POLICY "Users can manage inventory for their vehicles" ON inventory
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM user_vehicle uv
        WHERE uv.id = inventory.vehicle_id
        AND uv.owner_id = (SELECT auth.uid())
      )
    );

-- 3. jobs
-- Links to vehicle via vehicle_id
ALTER TABLE IF EXISTS jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage jobs for their vehicles" ON jobs;
CREATE POLICY "Users can manage jobs for their vehicles" ON jobs
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM user_vehicle uv
        WHERE uv.id = jobs.vehicle_id
        AND uv.owner_id = (SELECT auth.uid())
      )
    );

-- 4. job_tasks
-- Links to job via job_id
ALTER TABLE IF EXISTS job_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage job tasks" ON job_tasks;
CREATE POLICY "Users can manage job tasks" ON job_tasks
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM jobs j
        JOIN user_vehicle uv ON j.vehicle_id = uv.id
        WHERE j.id = job_tasks.job_id
        AND uv.owner_id = (SELECT auth.uid())
      )
    );

-- 5. job_parts
-- Links to job via job_id
ALTER TABLE IF EXISTS job_parts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage job parts" ON job_parts;
CREATE POLICY "Users can manage job parts" ON job_parts
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM jobs j
        JOIN user_vehicle uv ON j.vehicle_id = uv.id
        WHERE j.id = job_parts.job_id
        AND uv.owner_id = (SELECT auth.uid())
      )
    );
