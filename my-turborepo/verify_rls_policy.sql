-- Verify the user_vehicle_update_self RLS policy has the correct structure
-- Run this query to check if the WITH CHECK clause exists

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual AS using_clause,
    with_check AS with_check_clause,
    CASE 
        WHEN with_check IS NULL THEN '❌ MISSING WITH CHECK CLAUSE - Updates will fail!'
        WHEN qual = with_check THEN '✅ CORRECT - Both USING and WITH CHECK present'
        ELSE '⚠️ WARNING - USING and WITH CHECK differ'
    END AS status
FROM pg_policies
WHERE tablename = 'user_vehicle' 
  AND policyname = 'user_vehicle_update_self';

-- If the query shows "MISSING WITH CHECK CLAUSE", run fix_user_vehicle_update_rls.sql

