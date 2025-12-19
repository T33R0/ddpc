-- Add admin_notes column to issue_reports table
ALTER TABLE issue_reports ADD COLUMN IF NOT EXISTS admin_notes TEXT;
