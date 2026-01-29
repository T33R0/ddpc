-- Enable RLS for vehicle_bom and ensure component_types has correct policies
BEGIN;

  -- 1. Enable RLS on vehicle_bom
  ALTER TABLE public.vehicle_bom ENABLE ROW LEVEL SECURITY;

  -- 2. Policies for vehicle_bom
  -- READ: Allow authenticated users to view BOMs (shared knowledge base concept)
  -- Or strictly public if it's meant to be open data. Let's start with authenticated for now to match app usage.
  -- Actually, let's make it public read like component_types since it's reference data.
  CREATE POLICY "vehicle_bom_select_public" ON public.vehicle_bom
    FOR SELECT
    TO public
    USING (true);

  -- WRITE: Allow authenticated users to insert/update BOM items (Crowdsourcing model)
  CREATE POLICY "vehicle_bom_insert_authenticated" ON public.vehicle_bom
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

  CREATE POLICY "vehicle_bom_update_authenticated" ON public.vehicle_bom
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

  -- 3. Ensure component_types (formerly component_definitions) has correct RLS
  -- The rename preserves policies, but let's be safe and explicitly check/add if missing
  -- due to the rename potentially clarifying intent.
  -- Existing policy "component_definitions_select_public" should still exist but attached to the table.
  -- We'll add write access for authenticated users to allow expanding the catalog.
  
  CREATE POLICY "component_types_insert_authenticated" ON public.component_types
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

  CREATE POLICY "component_types_update_authenticated" ON public.component_types
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

COMMIT;
