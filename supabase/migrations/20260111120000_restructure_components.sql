-- Rename component_definitions to component_types
-- We use DO block to handle the rename safely if it already exists or helps idempotent runs, 
-- but standard ALTER is usually fine.
BEGIN;

  -- 1. Rename component_definitions to component_types
  -- Check if table exists to avoid errors on re-runs (though strictly re-runs shouldn't happen for same migration file)
  DO $$
  BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'component_definitions') THEN
      ALTER TABLE public.component_definitions RENAME TO component_types;
    END IF;
  END $$;

  -- 2. Add spec_schema to component_types
  ALTER TABLE public.component_types 
    ADD COLUMN IF NOT EXISTS spec_schema JSONB DEFAULT '{}'::jsonb;

  -- 3. Create vehicle_bom table
  CREATE TABLE IF NOT EXISTS public.vehicle_bom (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_trim_id UUID, -- Nullable for now, potential link to vehicle_template or trim table
    component_type_id UUID REFERENCES public.component_types(id),
    parent_component_id UUID REFERENCES public.vehicle_bom(id),
    location_on_vehicle TEXT,
    quantity INT DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- 4. Update vehicle_installed_components
  ALTER TABLE public.vehicle_installed_components 
    ADD COLUMN IF NOT EXISTS bom_id UUID REFERENCES public.vehicle_bom(id),
    ADD COLUMN IF NOT EXISTS specs JSONB DEFAULT '{}'::jsonb;

  -- Add indexes for performance
  CREATE INDEX IF NOT EXISTS idx_vehicle_bom_component_type_id ON public.vehicle_bom(component_type_id);
  CREATE INDEX IF NOT EXISTS idx_vehicle_bom_vehicle_trim_id ON public.vehicle_bom(vehicle_trim_id);
  CREATE INDEX IF NOT EXISTS idx_vehicle_installed_components_bom_id ON public.vehicle_installed_components(bom_id);

COMMIT;
