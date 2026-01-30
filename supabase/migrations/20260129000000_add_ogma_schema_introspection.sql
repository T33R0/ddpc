-- Ogma Schema Introspection Function
-- Allows Ogma to understand the database structure

-- Function to get an overview of all tables in a schema
CREATE OR REPLACE FUNCTION get_schema_overview(schema_name TEXT DEFAULT 'public')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'table_name', t.table_name,
      'columns', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'name', c.column_name,
            'type', c.data_type,
            'nullable', c.is_nullable = 'YES',
            'default', c.column_default
          )
          ORDER BY c.ordinal_position
        )
        FROM information_schema.columns c
        WHERE c.table_schema = schema_name
          AND c.table_name = t.table_name
      ),
      'row_count', (
        SELECT reltuples::bigint
        FROM pg_class pc
        JOIN pg_namespace pn ON pc.relnamespace = pn.oid
        WHERE pn.nspname = schema_name
          AND pc.relname = t.table_name
      ),
      'has_rls', (
        SELECT relrowsecurity
        FROM pg_class pc
        JOIN pg_namespace pn ON pc.relnamespace = pn.oid
        WHERE pn.nspname = schema_name
          AND pc.relname = t.table_name
      )
    )
  )
  INTO result
  FROM information_schema.tables t
  WHERE t.table_schema = schema_name
    AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Function to get details about a specific table
CREATE OR REPLACE FUNCTION get_table_details(p_table_name TEXT, schema_name TEXT DEFAULT 'public')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'table_name', p_table_name,
    'columns', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', c.column_name,
          'type', c.data_type,
          'nullable', c.is_nullable = 'YES',
          'default', c.column_default,
          'is_primary_key', (
            SELECT EXISTS (
              SELECT 1
              FROM information_schema.table_constraints tc
              JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
              WHERE tc.table_schema = schema_name
                AND tc.table_name = p_table_name
                AND tc.constraint_type = 'PRIMARY KEY'
                AND kcu.column_name = c.column_name
            )
          ),
          'foreign_key', (
            SELECT jsonb_build_object(
              'references_table', ccu.table_name,
              'references_column', ccu.column_name
            )
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu
              ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_schema = schema_name
              AND tc.table_name = p_table_name
              AND tc.constraint_type = 'FOREIGN KEY'
              AND kcu.column_name = c.column_name
            LIMIT 1
          )
        )
        ORDER BY c.ordinal_position
      )
      FROM information_schema.columns c
      WHERE c.table_schema = schema_name
        AND c.table_name = p_table_name
    ),
    'indexes', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', i.relname,
          'columns', (
            SELECT jsonb_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum))
            FROM pg_attribute a
            WHERE a.attrelid = t.oid
              AND a.attnum = ANY(ix.indkey)
          ),
          'is_unique', ix.indisunique,
          'is_primary', ix.indisprimary
        )
      )
      FROM pg_class t
      JOIN pg_namespace pn ON t.relnamespace = pn.oid
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON ix.indexrelid = i.oid
      WHERE pn.nspname = schema_name
        AND t.relname = p_table_name
    ),
    'policies', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', pol.polname,
          'command', CASE pol.polcmd
            WHEN 'r' THEN 'SELECT'
            WHEN 'a' THEN 'INSERT'
            WHEN 'w' THEN 'UPDATE'
            WHEN 'd' THEN 'DELETE'
            ELSE 'ALL'
          END,
          'permissive', pol.polpermissive
        )
      )
      FROM pg_policy pol
      JOIN pg_class pc ON pol.polrelid = pc.oid
      JOIN pg_namespace pn ON pc.relnamespace = pn.oid
      WHERE pn.nspname = schema_name
        AND pc.relname = p_table_name
    )
  )
  INTO result;

  RETURN result;
END;
$$;

-- Grant execute to authenticated users (Ogma runs as authenticated admin)
GRANT EXECUTE ON FUNCTION get_schema_overview(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_details(TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION get_schema_overview IS 'Returns JSON overview of all tables in a schema for Ogma introspection';
COMMENT ON FUNCTION get_table_details IS 'Returns detailed JSON info about a specific table for Ogma introspection';
