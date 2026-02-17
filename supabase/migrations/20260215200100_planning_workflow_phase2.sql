-- Phase 2: Planning Workflow — Draft → Ready → Execute
-- Adds plan_status to jobs table to support the draft/ready/active planning workflow.

ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS plan_status TEXT
CHECK (plan_status IN ('draft', 'ready', 'active'))
DEFAULT 'draft';

-- Backfill: Set existing in_progress jobs to 'active', completed to 'active', planned to 'draft'
UPDATE public.jobs SET plan_status = 'active' WHERE status = 'in_progress' AND plan_status IS NULL;
UPDATE public.jobs SET plan_status = 'active' WHERE status = 'completed' AND plan_status IS NULL;
UPDATE public.jobs SET plan_status = 'draft' WHERE status = 'planned' AND plan_status IS NULL;
UPDATE public.jobs SET plan_status = 'draft' WHERE plan_status IS NULL;
