-- Performance Fixes: Index foreign keys
-- Advisory: Unindexed Foreign Keys

-- ogma_improvements.source_session_id
CREATE INDEX IF NOT EXISTS ogma_improvements_source_session_id_idx ON public.ogma_improvements (source_session_id);

-- testimonials.user_id
CREATE INDEX IF NOT EXISTS testimonials_user_id_idx ON public.testimonials (user_id);

-- vehicle_bom.parent_component_id
CREATE INDEX IF NOT EXISTS vehicle_bom_parent_component_id_idx ON public.vehicle_bom (parent_component_id);

-- app_structure foreign keys
-- Wrap in DO block to avoid errors if columns generally missing (handling schema drift)
DO $$
BEGIN
    -- Check for parent_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'app_structure' AND column_name = 'parent_id') THEN
        CREATE INDEX IF NOT EXISTS app_structure_parent_id_idx ON public.app_structure (parent_id);
    END IF;

    -- Check for created_by
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'app_structure' AND column_name = 'created_by') THEN
        CREATE INDEX IF NOT EXISTS app_structure_created_by_idx ON public.app_structure (created_by);
    END IF;

    -- Check for last_updated_by
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'app_structure' AND column_name = 'last_updated_by') THEN
        CREATE INDEX IF NOT EXISTS app_structure_last_updated_by_idx ON public.app_structure (last_updated_by);
    END IF;
END $$;
