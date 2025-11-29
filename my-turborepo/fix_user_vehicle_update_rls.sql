-- Fix RLS policy for user_vehicle UPDATE operations
-- The current policy only has USING clause, but UPDATE operations also need WITH CHECK clause
-- This ensures users can both see AND update their own vehicles
--
-- Current policy (incomplete):
--   USING (auth.uid() = owner_id)
--   Missing: WITH CHECK clause
--
-- Problem: Without WITH CHECK, PostgreSQL RLS blocks UPDATE operations even when USING passes.
-- This causes updates to fail silently or return permission errors.
--
-- Solution: Add WITH CHECK clause that matches USING logic.
-- This ensures:
--   1. Users can see rows they own (USING)
--   2. Users can update rows they own (WITH CHECK)
--   3. Users CANNOT change owner_id to another user (security improvement)
--
-- Security Note: The WITH CHECK prevents users from transferring vehicle ownership
-- to other users, which is a critical security feature.

-- Use ALTER POLICY to preserve existing policy attributes (like TO public)
ALTER POLICY "user_vehicle_update_self" ON public.user_vehicle
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- Verify the policy was created correctly
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_vehicle' AND policyname = 'user_vehicle_update_self';

