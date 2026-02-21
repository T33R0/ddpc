-- Add "Service Reminders" email channel for opt-out support
INSERT INTO public.email_channels (name, slug, description)
VALUES (
  'Service Reminders',
  'service-reminders',
  'Weekly reminders when your vehicles have upcoming or overdue maintenance.'
)
ON CONFLICT (slug) DO NOTHING;

-- Growth analytics events table
-- Lightweight event tracking for conversion/retention KPIs
CREATE TABLE IF NOT EXISTS public.growth_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for querying by event type and date range
CREATE INDEX IF NOT EXISTS idx_growth_events_type_created
  ON public.growth_events (event_type, created_at DESC);

-- Index for querying by user
CREATE INDEX IF NOT EXISTS idx_growth_events_user
  ON public.growth_events (user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.growth_events ENABLE ROW LEVEL SECURITY;

-- Admin-only write access (service role bypasses RLS)
-- No user-facing read needed — this is internal analytics
CREATE POLICY "Service role only"
  ON public.growth_events
  FOR ALL
  TO authenticated
  USING (false);

-- RPC for admin dashboard analytics
-- Queries actual source tables for historical accuracy.
-- growth_events only used for return_visits (no source table equivalent).
CREATE OR REPLACE FUNCTION public.get_growth_metrics(days_back integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  start_date timestamptz;
BEGIN
  start_date := now() - (days_back || ' days')::interval;

  SELECT jsonb_build_object(
    -- Core counts from source tables
    'signups', (
      SELECT count(*) FROM public.user_profile
      WHERE created_at >= start_date
    ),
    'vehicles_added', (
      SELECT count(*) FROM public.user_vehicle
      WHERE created_at >= start_date
    ),
    'maintenance_logged', (
      SELECT count(*) FROM public.maintenance_log
      WHERE created_at >= start_date
    ),
    'fuel_logged', (
      SELECT count(*) FROM public.fuel_log
      WHERE created_at >= start_date
    ),
    'onboarding_completed', (
      SELECT count(*) FROM public.user_profile
      WHERE onboarding_completed = true
        AND onboarding_completed_at >= start_date
    ),
    -- Return visits from growth_events (forward-looking, no source table)
    'return_visits', (
      SELECT count(*) FROM public.growth_events
      WHERE event_type = 'return_visit' AND created_at >= start_date
    ),
    -- Daily signups from user_profile
    'daily_signups', (
      SELECT coalesce(jsonb_agg(row_to_json(d) ORDER BY d.day), '[]'::jsonb)
      FROM (
        SELECT date_trunc('day', created_at)::date AS day, count(*) AS count
        FROM public.user_profile
        WHERE created_at >= start_date
        GROUP BY 1 ORDER BY 1
      ) d
    ),
    -- Daily active users: unique users who did anything
    'daily_active_users', (
      SELECT coalesce(jsonb_agg(row_to_json(d) ORDER BY d.day), '[]'::jsonb)
      FROM (
        SELECT day, count(DISTINCT user_id) AS count
        FROM (
          SELECT date_trunc('day', fl.created_at)::date AS day, uv.owner_id AS user_id
          FROM public.fuel_log fl
          JOIN public.user_vehicle uv ON fl.user_vehicle_id = uv.id
          WHERE fl.created_at >= start_date
          UNION ALL
          SELECT date_trunc('day', ml.created_at)::date AS day, uv.owner_id AS user_id
          FROM public.maintenance_log ml
          JOIN public.user_vehicle uv ON ml.user_vehicle_id = uv.id
          WHERE ml.created_at >= start_date
          UNION ALL
          SELECT date_trunc('day', created_at)::date AS day, owner_id AS user_id
          FROM public.user_vehicle
          WHERE created_at >= start_date
          UNION ALL
          SELECT date_trunc('day', created_at)::date AS day, user_id
          FROM public.growth_events
          WHERE created_at >= start_date AND user_id IS NOT NULL
        ) activity
        GROUP BY 1 ORDER BY 1
      ) d
    ),
    -- 7-day retention: of signups in window, how many had activity 7-14 days later
    'seven_day_retention', (
      SELECT round(
        (count(DISTINCT activity.user_id)::numeric / NULLIF(count(DISTINCT up.user_id), 0)) * 100, 1
      )
      FROM public.user_profile up
      LEFT JOIN (
        SELECT uv.owner_id AS user_id, fl.created_at AS activity_at
        FROM public.fuel_log fl
        JOIN public.user_vehicle uv ON fl.user_vehicle_id = uv.id
        UNION ALL
        SELECT uv.owner_id AS user_id, ml.created_at AS activity_at
        FROM public.maintenance_log ml
        JOIN public.user_vehicle uv ON ml.user_vehicle_id = uv.id
        UNION ALL
        SELECT owner_id AS user_id, created_at AS activity_at
        FROM public.user_vehicle
      ) activity
        ON up.user_id = activity.user_id
        AND activity.activity_at >= up.created_at + interval '7 days'
        AND activity.activity_at < up.created_at + interval '14 days'
      WHERE up.created_at >= start_date
        AND up.created_at < now() - interval '7 days'
    ),
    -- Activation rate: % of signups who added at least one vehicle
    'activation_rate', (
      SELECT round(
        (count(DISTINCT uv.owner_id)::numeric / NULLIF(count(DISTINCT up.user_id), 0)) * 100, 1
      )
      FROM public.user_profile up
      LEFT JOIN public.user_vehicle uv ON up.user_id = uv.owner_id
      WHERE up.created_at >= start_date
    ),
    -- All-time totals for context
    'totals', jsonb_build_object(
      'users', (SELECT count(*) FROM public.user_profile),
      'vehicles', (SELECT count(*) FROM public.user_vehicle),
      'maintenance_logs', (SELECT count(*) FROM public.maintenance_log),
      'fuel_logs', (SELECT count(*) FROM public.fuel_log)
    )
  ) INTO result;

  RETURN result;
END;
$$;
