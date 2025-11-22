-- Add missing column 'diff' to activity_log if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_log' AND column_name = 'diff') THEN
        ALTER TABLE public.activity_log ADD COLUMN diff jsonb;
    END IF;
END $$;

-- Ensure other columns exist as well
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_log' AND column_name = 'old_data') THEN
        ALTER TABLE public.activity_log ADD COLUMN old_data jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_log' AND column_name = 'new_data') THEN
        ALTER TABLE public.activity_log ADD COLUMN new_data jsonb;
    END IF;
END $$;



