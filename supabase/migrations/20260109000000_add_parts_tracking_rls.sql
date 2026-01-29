-- Add RLS policies for parts tracking system
-- This enables users to create parts and track installed components on their vehicles

-- Enable RLS on master_parts_list if not already enabled
ALTER TABLE master_parts_list ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert into master_parts_list (catalog/reference table)
-- This is a shared catalog, so any authenticated user can add parts
CREATE POLICY "master_parts_list_insert_authenticated" ON master_parts_list
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update their own parts (optional, for future use)
CREATE POLICY "master_parts_list_update_authenticated" ON master_parts_list
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Check if vehicle_installed_components table exists and add policies
DO $$
BEGIN
  -- Check if table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicle_installed_components'
  ) THEN
    -- Enable RLS
    ALTER TABLE vehicle_installed_components ENABLE ROW LEVEL SECURITY;

    -- Allow users to manage installed components for their own vehicles
    CREATE POLICY "vehicle_installed_components_owner_all" ON vehicle_installed_components
      FOR ALL
      USING (
        EXISTS (
          SELECT 1
          FROM user_vehicle uv
          WHERE uv.id = vehicle_installed_components.user_vehicle_id
          AND uv.owner_id = (SELECT auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM user_vehicle uv
          WHERE uv.id = vehicle_installed_components.user_vehicle_id
          AND uv.owner_id = (SELECT auth.uid())
        )
      );
  END IF;
END $$;

-- Check if component_definitions table exists and add policies if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'component_definitions'
  ) THEN
    -- Enable RLS
    ALTER TABLE component_definitions ENABLE ROW LEVEL SECURITY;

    -- Allow public read access to component definitions (reference data)
    CREATE POLICY "component_definitions_select_public" ON component_definitions
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

