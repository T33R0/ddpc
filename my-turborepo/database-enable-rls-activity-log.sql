-- Enable RLS on activity_log
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own activity logs
CREATE POLICY activity_log_select_own ON public.activity_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy to allow users to insert their own activity logs
-- (Even if not currently used by client, good practice if RLS is enabled)
CREATE POLICY activity_log_insert_own ON public.activity_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow service role full access
CREATE POLICY activity_log_service_all ON public.activity_log
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
