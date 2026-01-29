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

-- Policies
CREATE POLICY "Users can view their own compute ledger"
    ON public.compute_ledger FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.ogma_chat_sessions
            WHERE id = compute_ledger.session_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own compute ledger entries"
    ON public.compute_ledger FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ogma_chat_sessions
            WHERE id = compute_ledger.session_id
            AND user_id = auth.uid()
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_compute_ledger_session_id ON public.compute_ledger(session_id);
CREATE INDEX IF NOT EXISTS idx_compute_ledger_timestamp ON public.compute_ledger(timestamp);
CREATE INDEX IF NOT EXISTS idx_compute_ledger_model_used ON public.compute_ledger(model_used);

-- Function: get_compute_health_summary
-- Fixed: Removed nested aggregate calls by using a CTE for model-level stats
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
        -- Aggregate per model first
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
                SELECT 1 FROM public.ogma_chat_sessions
                WHERE id = p_session_id AND user_id = auth.uid()
            )
        )
        GROUP BY model_used
    ),
    overall_stats AS (
        -- Aggregate totals
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
