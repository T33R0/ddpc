-- Add onboarding fields to user_vehicle table
-- acquisition_date: Date the vehicle was acquired
-- ownership_end_date: Date the vehicle was sold/retired (if applicable)
-- acquisition_type: Method of acquisition (Dealer, Private Party, etc.)
-- acquisition_cost: Cost of acquisition
-- is_onboarding_completed: Flag to track if the onboarding modal has been shown/completed

ALTER TABLE public.user_vehicle
ADD COLUMN IF NOT EXISTS acquisition_date DATE,
ADD COLUMN IF NOT EXISTS ownership_end_date DATE,
ADD COLUMN IF NOT EXISTS acquisition_type TEXT,
ADD COLUMN IF NOT EXISTS acquisition_cost NUMERIC,
ADD COLUMN IF NOT EXISTS is_onboarding_completed BOOLEAN DEFAULT FALSE;

-- Force RLS cache refresh (optional, but good practice)
NOTIFY pgrst, 'reload config';
