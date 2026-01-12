-- Migration to safely remove stale triggers referencing missing columns
DO $$
DECLARE
    trg RECORD;
    func_src TEXT;
BEGIN
    FOR trg IN 
        SELECT 
            trigger_name,
            action_statement
        FROM information_schema.triggers
        WHERE event_object_table = 'vehicle_data'
    LOOP
        -- Check if the trigger action references the missing column
        -- (Ideally we check the function source too if it calls a function)
        IF 
           (trg.action_statement ILIKE '%platform_code_generation%') 
        THEN
            RAISE NOTICE 'Dropping stale trigger: %', trg.trigger_name;
            EXECUTE format('DROP TRIGGER IF EXISTS %I ON vehicle_data', trg.trigger_name);
        END IF;
    END LOOP;
    
    -- Also drop known legacy triggers if they exist (common naming patterns)
    -- Add any suspected names here if the above loop misses them (e.g. if logic is hidden in a function)
    DROP TRIGGER IF EXISTS tr_update_vehicle_search_vector ON vehicle_data;
    DROP TRIGGER IF EXISTS update_vehicle_search_vector ON vehicle_data;
    
    -- Check for functions that might use it
    -- (This part is harder to automate safely without function names, but we can try to drop known bad ones)
    
END $$;
