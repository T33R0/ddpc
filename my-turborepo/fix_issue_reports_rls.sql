-- Fix RLS policies for issue_reports to allow anonymous inserts
-- and ensure authenticated users can also insert/read.

-- 1. Drop existing policies to start fresh
DROP POLICY IF EXISTS "Enable insert for all users" ON public.issue_reports;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.issue_reports;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.issue_reports;

-- 2. Create permissive insert policy (for anon and authenticated)
CREATE POLICY "Enable insert for all users" ON public.issue_reports
    FOR INSERT
    WITH CHECK (true);

-- 3. Create read policy (authenticated only)
CREATE POLICY "Enable read for authenticated users" ON public.issue_reports
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- 4. Create update policy (authenticated only)
CREATE POLICY "Enable update for authenticated users" ON public.issue_reports
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- 5. Verify RLS is enabled
ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;
