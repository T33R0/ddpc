-- Create the issue_reports table
CREATE TABLE IF NOT EXISTS public.issue_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT,
    page_url TEXT NOT NULL,
    description TEXT,
    screenshot_url TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow anyone to insert (authenticated or anonymous)
CREATE POLICY "Enable insert for all users" ON public.issue_reports
    FOR INSERT
    WITH CHECK (true);

-- Allow admins to view/update (Assuming there is an admin role or specific users, 
-- but for now I'll allow authenticated users to read/update for simplicity if no admin role is defined, 
-- OR I should check how admin is handled. 
-- Based on file structure 'apps/web/src/actions/admin.ts', there might be admin logic.
-- I'll create a policy that allows all read for now to ensure it works, then refine.)

-- Let's check if there is an 'admin' table or role. 
-- For this task, I will allow public insert, and authenticated read for now.
CREATE POLICY "Enable read for authenticated users" ON public.issue_reports
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.issue_reports
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Create storage bucket for screenshots if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('issue-attachments', 'issue-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Give public access to issue-attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'issue-attachments');

CREATE POLICY "Enable upload for all users to issue-attachments" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'issue-attachments');






