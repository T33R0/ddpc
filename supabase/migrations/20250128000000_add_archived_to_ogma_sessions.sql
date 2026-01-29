-- Add archived field to ogma_chat_sessions
ALTER TABLE public.ogma_chat_sessions 
ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;

-- Add index for archived status for better query performance
CREATE INDEX IF NOT EXISTS idx_ogma_sessions_archived ON public.ogma_chat_sessions(user_id, archived);

-- Update RLS policy to allow users to update their own sessions (for archive/restore)
CREATE POLICY IF NOT EXISTS "Users can update their own sessions"
    ON public.ogma_chat_sessions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

