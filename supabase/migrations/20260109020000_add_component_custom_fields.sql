-- Add custom lifespan and purchase cost fields to vehicle_installed_components
-- These allow users to override default lifespans and track part costs

DO $$
BEGIN
  -- Check if table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicle_installed_components'
  ) THEN
    -- Add custom_lifespan_miles if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'vehicle_installed_components' 
      AND column_name = 'custom_lifespan_miles'
    ) THEN
      ALTER TABLE vehicle_installed_components 
      ADD COLUMN custom_lifespan_miles integer;
    END IF;

    -- Add custom_lifespan_months if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'vehicle_installed_components' 
      AND column_name = 'custom_lifespan_months'
    ) THEN
      ALTER TABLE vehicle_installed_components 
      ADD COLUMN custom_lifespan_months integer;
    END IF;

    -- Add purchase_cost if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'vehicle_installed_components' 
      AND column_name = 'purchase_cost'
    ) THEN
      ALTER TABLE vehicle_installed_components 
      ADD COLUMN purchase_cost numeric(10, 2);
    END IF;

    -- Add id column if it doesn't exist (for updates)
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'vehicle_installed_components' 
      AND column_name = 'id'
    ) THEN
      ALTER TABLE vehicle_installed_components 
      ADD COLUMN id uuid NOT NULL DEFAULT gen_random_uuid();
      
      -- Make it the primary key if there isn't one
      IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'vehicle_installed_components' 
        AND constraint_type = 'PRIMARY KEY'
      ) THEN
        ALTER TABLE vehicle_installed_components 
        ADD CONSTRAINT vehicle_installed_components_pkey PRIMARY KEY (id);
      END IF;
    END IF;
  END IF;
END $$;

