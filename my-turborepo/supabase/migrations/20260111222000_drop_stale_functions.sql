-- Migration to clean up functions referencing the deleted column "platform_code_generation"
-- This uses CASCADE to also remove any triggers that call these functions.

DO $$
DECLARE
    func_rec RECORD;
BEGIN
    FOR func_rec IN 
        SELECT 
            p.proname, 
            p.oid::regprocedure as signature,
            n.nspname as schema_name
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.prosrc ILIKE '%platform_code_generation%'
        AND n.nspname = 'public' -- Limit to public schema to be safe
    LOOP
        RAISE NOTICE 'Dropping function referencing missing column: %.%', func_rec.schema_name, func_rec.proname;
        
        -- Cascading drop removes triggers that depend on this function
        EXECUTE format('DROP FUNCTION %s CASCADE', func_rec.signature);
    END LOOP;
END $$;
