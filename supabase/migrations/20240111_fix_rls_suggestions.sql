-- RLS Policy Suggestions
-- Advisory: RLS Policy Always True / Multiple Permissive Policies
-- IMPORTANT: Review these carefully. 'true' policies are often placeholders during development.

-- 1. Table: vehicle_bom
-- Current: vehicle_bom_insert_authenticated (WITH CHECK (true))
-- Suggestion: Restrict to users who own the parent vehicle or have a specific role.
-- EXAMPLE (Uncomment and modify):
-- DROP POLICY "vehicle_bom_insert_authenticated" ON public.vehicle_bom;
-- CREATE POLICY "vehicle_bom_insert_authenticated" ON public.vehicle_bom
-- AS PERMISSIVE FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   EXISTS (
--     SELECT 1 FROM public.vehicles v
--     WHERE v.id = vehicle_bom.vehicle_id AND v.owner_id = auth.uid()
--   )
-- );

-- Current: vehicle_bom_update_authenticated (USING (true), WITH CHECK (true))
-- Suggestion: Similar to above, restrict update rights.
-- EXAMPLE (Uncomment and modify):
-- DROP POLICY "vehicle_bom_update_authenticated" ON public.vehicle_bom;
-- CREATE POLICY "vehicle_bom_update_authenticated" ON public.vehicle_bom
-- AS PERMISSIVE FOR UPDATE
-- TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM public.vehicles v
--     WHERE v.id = vehicle_bom.vehicle_id AND v.owner_id = auth.uid()
--   )
-- )
-- WITH CHECK (
--   EXISTS (
--     SELECT 1 FROM public.vehicles v
--     WHERE v.id = vehicle_bom.vehicle_id AND v.owner_id = auth.uid()
--   )
-- );


-- 2. Table: app_structure
-- Advisory: Multiple Permissive Policies (authenticator, dashboard_user have overlapping policies)
-- This often happens if you have "Allow All" AND "Allow Read".
-- Suggestion: Audit policies on `app_structure` and remove redundant ones. 
-- For example, if you have an admin policy that covers everything, you might not need separate granular ones if the user is an admin.
-- Or, ensure your policies are mutually exclusive or clearly defined.

-- To view current policies:
-- SELECT * FROM pg_policies WHERE tablename = 'app_structure';
