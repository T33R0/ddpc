-- Fix FK on mod_steps to point to mod_plans instead of job_plans
DO $$
BEGIN
    -- Drop the incorrect constraint if it exists (it points to job_plans)
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'mod_steps_mod_plan_id_fkey'
        AND table_name = 'mod_steps'
    ) THEN
        ALTER TABLE mod_steps DROP CONSTRAINT mod_steps_mod_plan_id_fkey;
    END IF;

    -- Add the correct constraint pointing to mod_plans
    ALTER TABLE mod_steps
    ADD CONSTRAINT mod_steps_mod_plan_id_fkey
    FOREIGN KEY (mod_plan_id)
    REFERENCES mod_plans(id)
    ON DELETE CASCADE;
END $$;
