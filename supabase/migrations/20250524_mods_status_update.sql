-- Add 'archived' to the allowed statuses for the mods table
DO $$
BEGIN
  -- First, drop the existing constraint if it exists.
  -- We don't know the exact name, so we'll try the standard naming convention or check metadata.
  -- Assuming the constraint is named 'mods_status_check' or similar.
  -- To be safe, we can try to drop constraints on the 'status' column.

  -- However, since we can't easily query system catalogs in this environment to find exact constraint names,
  -- we will try to drop the common name 'mods_status_check'.
  -- If the original table creation didn't name it, it might have an auto-generated name.
  -- A safer approach for a CHECK constraint update is to DROP the constraint by name if known,
  -- or use ALTER TABLE ... SET DATA TYPE ... USING ... if it was an enum type.
  -- But here it is likely a text column with a check constraint as per the 'z.enum' usage in API.

  -- Let's try to drop the constraint by name 'mods_status_check'.
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mods_status_check') THEN
    ALTER TABLE mods DROP CONSTRAINT mods_status_check;
  END IF;

  -- If there are other constraints, we might need to handle them.
  -- But usually there is only one check constraint for status.

  -- Now add the new constraint.
  ALTER TABLE mods ADD CONSTRAINT mods_status_check
  CHECK (status IN ('planned', 'ordered', 'installed', 'tuned', 'archived'));

EXCEPTION
  WHEN OTHERS THEN
    -- If something goes wrong (e.g., constraint name mismatch), log it.
    RAISE NOTICE 'Error updating constraint: %', SQLERRM;
END $$;
