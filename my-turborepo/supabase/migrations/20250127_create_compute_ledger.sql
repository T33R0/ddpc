-- Create compute_ledger table to track AI model usage and costs
CREATE TABLE IF NOT EXISTS public.compute_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.ogma_chat_sessions(id) ON DELETE CASCADE,
    interaction_id UUID NOT NULL DEFAULT gen_random_uuid(),
    model_used TEXT NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    cost_usd NUMERIC(10, 8) NOT NULL DEFAULT 0,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.compute_ledger ENABLE ROW LEVEL SECURITY;

-- Policies for compute_ledger
-- Users can view their own compute costs
CREATE POLICY "Users can view their own compute ledger"
    ON public.compute_ledger
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.ogma_chat_sessions
            WHERE id = compute_ledger.session_id
            AND user_id = auth.uid()
        )
    );

-- System can insert compute ledger entries (via service role)
-- Note: In production, this should be done via a service role or RPC function
-- For now, we allow inserts if the session belongs to the user
CREATE POLICY "Users can insert their own compute ledger entries"
    ON public.compute_ledger
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ogma_chat_sessions
            WHERE id = compute_ledger.session_id
            AND user_id = auth.uid()
        )
    );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_compute_ledger_session_id ON public.compute_ledger(session_id);
CREATE INDEX IF NOT EXISTS idx_compute_ledger_timestamp ON public.compute_ledger(timestamp);
CREATE INDEX IF NOT EXISTS idx_compute_ledger_model_used ON public.compute_ledger(model_used);

-- Add a function to get financial health summary
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
    SELECT 
        COALESCE(SUM(cost_usd), 0)::NUMERIC as total_cost_usd,
        COALESCE(SUM(input_tokens), 0)::BIGINT as total_input_tokens,
        COALESCE(SUM(output_tokens), 0)::BIGINT as total_output_tokens,
        COUNT(*)::BIGINT as total_interactions,
        CASE 
            WHEN COUNT(*) > 0 THEN COALESCE(SUM(cost_usd), 0) / COUNT(*)
            ELSE 0
        END::NUMERIC as avg_cost_per_interaction,
        COALESCE(
            jsonb_object_agg(
                model_used,
                jsonb_build_object(
                    'cost', SUM(cost_usd),
                    'input_tokens', SUM(input_tokens),
                    'output_tokens', SUM(output_tokens),
                    'count', COUNT(*)
                )
            ) FILTER (WHERE model_used IS NOT NULL),
            '{}'::jsonb
        ) as model_breakdown
    FROM public.compute_ledger
    WHERE (p_session_id IS NULL OR session_id = p_session_id)
    AND (
        p_session_id IS NULL OR
        EXISTS (
            SELECT 1 FROM public.ogma_chat_sessions
            WHERE id = p_session_id AND user_id = auth.uid()
        )
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_compute_health_summary(UUID) TO authenticated;

