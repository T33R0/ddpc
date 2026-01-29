-- Ensure the theme column exists and has the correct properties
ALTER TABLE public.user_profile
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'dark';

-- Update any null values to the default 'dark' to ensure consistency
UPDATE public.user_profile
SET theme = 'dark'
WHERE theme IS NULL;

-- Remove existing constraint if it exists to avoid conflicts when recreating
ALTER TABLE public.user_profile
DROP CONSTRAINT IF EXISTS user_profile_theme_check;

-- Add check constraint to enforce valid theme values matching the frontend type
ALTER TABLE public.user_profile
ADD CONSTRAINT user_profile_theme_check
CHECK (theme IN ('light', 'dark', 'auto'));

-- Explicitly grant update permission on the column (redundant with table grant but safe)
GRANT UPDATE (theme) ON public.user_profile TO authenticated;
