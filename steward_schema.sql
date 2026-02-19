-- Steward Schema Dump
-- Tables: steward_chat_sessions, steward_chat_messages, steward_improvements, compute_ledger

-- 1. steward_chat_sessions
CREATE TABLE IF NOT EXISTS public.steward_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    archived BOOLEAN NOT NULL DEFAULT false, -- Added from migration
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_steward_sessions_user_id ON public.steward_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_steward_sessions_archived ON public.steward_chat_sessions(user_id, archived);

ALTER TABLE public.steward_chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON public.steward_chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sessions" ON public.steward_chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sessions" ON public.steward_chat_sessions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own sessions" ON public.steward_chat_sessions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 2. steward_chat_messages
CREATE TABLE IF NOT EXISTS public.steward_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.steward_chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_steward_messages_session_id ON public.steward_chat_messages(session_id);

ALTER TABLE public.steward_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from their sessions" ON public.steward_chat_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.steward_chat_sessions WHERE id = steward_chat_messages.session_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert messages into their sessions" ON public.steward_chat_messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.steward_chat_sessions WHERE id = steward_chat_messages.session_id AND user_id = auth.uid())
);


-- 3. steward_improvements
CREATE TABLE IF NOT EXISTS public.steward_improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  category TEXT NOT NULL CHECK (category IN ('Correction', 'Strategy', 'Preference', 'Insight')),
  insight TEXT NOT NULL,
  confidence_score INTEGER NOT NULL CHECK (confidence_score BETWEEN 1 AND 100),
  source_session_id UUID REFERENCES steward_chat_sessions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_steward_improvements_confidence_created ON public.steward_improvements(confidence_score DESC, created_at DESC);

ALTER TABLE public.steward_improvements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read improvements" ON public.steward_improvements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert improvements" ON public.steward_improvements FOR INSERT TO authenticated WITH CHECK (true);


-- 4. compute_ledger
CREATE TABLE IF NOT EXISTS public.compute_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.steward_chat_sessions(id) ON DELETE CASCADE,
    interaction_id UUID NOT NULL DEFAULT gen_random_uuid(),
    model_used TEXT NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    cost_usd NUMERIC(10, 8) NOT NULL DEFAULT 0,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compute_ledger_session_id ON public.compute_ledger(session_id);
CREATE INDEX IF NOT EXISTS idx_compute_ledger_timestamp ON public.compute_ledger(timestamp);
CREATE INDEX IF NOT EXISTS idx_compute_ledger_model_used ON public.compute_ledger(model_used);

ALTER TABLE public.compute_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own compute ledger" ON public.compute_ledger FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.steward_chat_sessions WHERE id = compute_ledger.session_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert their own compute ledger entries" ON public.compute_ledger FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.steward_chat_sessions WHERE id = compute_ledger.session_id AND user_id = auth.uid())
);


-- Functions

-- get_compute_health_summary
CREATE OR REPLACE FUNCTION public.get_compute_health_summary(p_session_id UUID DEFAULT NULL)
RETURNS TABLE (
    total_cost_usd NUMERIC,
    total_input_tokens BIGINT,
    total_output_tokens BIGINT,
    total_interactions BIGINT,
    avg_cost_per_interaction NUMERIC,
    model_breakdown JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH model_stats AS (
        SELECT 
            model_used,
            SUM(cost_usd) as m_cost,
            SUM(input_tokens) as m_input,
            SUM(output_tokens) as m_output,
            COUNT(*) as m_count
        FROM public.compute_ledger cl
        WHERE (p_session_id IS NULL OR cl.session_id = p_session_id)
        AND (
            p_session_id IS NULL OR
            EXISTS (
                SELECT 1 FROM public.steward_chat_sessions
                WHERE id = p_session_id AND user_id = auth.uid()
            )
        )
        GROUP BY model_used
    ),
    overall_stats AS (
        SELECT
            SUM(m_cost) as total_cost,
            SUM(m_input) as total_input,
            SUM(m_output) as total_output,
            SUM(m_count) as total_count
        FROM model_stats
    )
    SELECT 
        COALESCE(total_cost, 0)::NUMERIC as total_cost_usd,
        COALESCE(total_input, 0)::BIGINT as total_input_tokens,
        COALESCE(total_output, 0)::BIGINT as total_output_tokens,
        COALESCE(total_count, 0)::BIGINT as total_interactions,
        CASE 
            WHEN total_count > 0 THEN COALESCE(total_cost, 0) / total_count
            ELSE 0
        END::NUMERIC as avg_cost_per_interaction,
        COALESCE(
            (
                SELECT jsonb_object_agg(
                    model_used,
                    jsonb_build_object(
                        'cost', m_cost,
                        'input_tokens', m_input,
                        'output_tokens', m_output,
                        'count', m_count
                    )
                )
                FROM model_stats
            ),
            '{}'::jsonb
        ) as model_breakdown
    FROM overall_stats;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_compute_health_summary(UUID) TO authenticated;
