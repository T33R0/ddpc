import { tool, jsonSchema } from 'ai';

// Helper to create tools with type erasure for TypeScript
const createUntypedTool = (config: any): any => tool(config);

/**
 * Tool: get_database_schema
 * Returns an overview of all tables in the database
 * Uses Supabase RPC function for introspection
 */
export const get_database_schema = createUntypedTool({
  description: 'Returns an overview of all database tables including columns, types, and row counts.',
  parameters: jsonSchema({
    type: 'object',
    properties: {
      schema_name: { type: 'string', description: 'The database schema to inspect. Defaults to "public".' },
    },
  }),
  execute: async ({ schema_name: schemaArg }: { schema_name?: string }) => {
    const schema_name = schemaArg || 'public';

    if (typeof window === 'undefined') {
      console.log(`[get_database_schema] Tool called with schema: ${schema_name}`);
    }

    try {
      // Dynamic import to avoid client-side issues
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();

      const { data, error } = await supabase.rpc('get_schema_overview', {
        schema_name: schema_name || 'public'
      });

      if (error) {
        console.error('[get_database_schema] RPC error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      if (typeof window === 'undefined') {
        console.log(`[get_database_schema] Successfully retrieved schema with ${data?.length || 0} tables`);
      }

      return {
        success: true,
        schema: schema_name,
        tables: data,
        table_count: data?.length || 0,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[get_database_schema] Error:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});

/**
 * Tool: get_table_details
 * Returns detailed info about a specific table
 */
export const get_table_details = createUntypedTool({
  description: 'Returns detailed info about a specific table including columns, indexes, and RLS policies.',
  parameters: jsonSchema({
    type: 'object',
    properties: {
      table_name: { type: 'string', description: 'The name of the table to get details for.' },
      schema_name: { type: 'string', description: 'The database schema. Defaults to "public".' },
    },
    required: ['table_name'],
  }),
  execute: async ({ table_name, schema_name: schemaArg }: { table_name: string; schema_name?: string }) => {
    const schema_name = schemaArg || 'public';

    if (typeof window === 'undefined') {
      console.log(`[get_table_details] Tool called for table: ${schema_name}.${table_name}`);
    }

    try {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();

      const { data, error } = await supabase.rpc('get_table_details', {
        p_table_name: table_name,
        schema_name: schema_name || 'public'
      });

      if (error) {
        console.error('[get_table_details] RPC error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        table: data,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[get_table_details] Error:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});
