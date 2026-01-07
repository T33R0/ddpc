-- Create ogma_chat_sessions table
CREATE TABLE IF NOT EXISTS public.ogma_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create ogma_chat_messages table
CREATE TABLE IF NOT EXISTS public.ogma_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.ogma_chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ogma_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ogma_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for ogma_chat_sessions
CREATE POLICY "Users can view their own sessions"
    ON public.ogma_chat_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
    ON public.ogma_chat_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
    ON public.ogma_chat_sessions
    FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for ogma_chat_messages
CREATE POLICY "Users can view messages from their sessions"
    ON public.ogma_chat_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.ogma_chat_sessions
            WHERE id = ogma_chat_messages.session_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages into their sessions"
    ON public.ogma_chat_messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ogma_chat_sessions
            WHERE id = ogma_chat_messages.session_id
            AND user_id = auth.uid()
        )
    );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ogma_sessions_user_id ON public.ogma_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ogma_messages_session_id ON public.ogma_chat_messages(session_id);
