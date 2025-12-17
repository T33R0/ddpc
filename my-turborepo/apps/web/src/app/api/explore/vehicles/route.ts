import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { VehicleSummary, TrimVariant } from '@repo/types';
import type { SupabaseFilter } from '../../../../features/explore/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase environment variables are not configured.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const NUMERIC_COLUMNS = [
  'year',
  'horsepower_hp',
  'torque_ft_lbs',
  'doors',
  'total_seating',
  'cylinders',
  'length_in',
  'width_in',
  'height_in'
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10), 1);
    const pageSizeParam = parseInt(searchParams.get('pageSize') ?? '24', 10);
    // Fetch more rows to ensure we get enough groups after aggregation
    const fetchLimit = pageSizeParam * 5;
    const offset = (page - 1) * fetchLimit;

    let filters: SupabaseFilter[] = [];
    try {
      const filtersParam = searchParams.get('filters');
      if (filtersParam) {
        filters = JSON.parse(filtersParam);
      }
    } catch (e) {
      console.error('Failed to parse filters', e);
    }

    // Try querying the View first (Typed columns)
    let usingView = true;
    let query = supabase.from('v_vehicle_data_typed').select('*');

    // Apply Filters function
    const applyFilters = (q: any, isView: boolean) => {
      filters.forEach((filter) => {
        if (!filter.value) return; // Skip empty values

        let column = filter.column;

        // Map to numeric column if using view and column is in list
        if (isView && NUMERIC_COLUMNS.includes(column)) {
          column = `${column}_num`;
        }

        const value = filter.value;

        switch (filter.operator) {
          case 'eq':
            q = q.eq(column, value);
            break;
          case 'neq':
            q = q.neq(column, value);
            break;
          case 'gt':
            q = q.gt(column, value);
            break;
          case 'lt':
            q = q.lt(column, value);
            break;
          case 'ilike':
            q = q.ilike(column, `%${value}%`);
            break;
          default:
            q = q.eq(column, value);
        }
      });
      return q;
    };

    query = applyFilters(query, true);
    query = query.range(offset, offset + fetchLimit - 1);

    // Sort by year desc, make, model (default sort)
    // Use year_num for sorting if using view
    query = query.order('year_num', { ascending: false }).order('make').order('model');

    let { data, error } = await query;

    // Fallback to table if View doesn't exist
    if (error && error.code === '42P01') {
      console.warn('View v_vehicle_data_typed not found, falling back to vehicle_data table. Numeric filters may be inaccurate.');
      usingView = false;
      query = supabase.from('vehicle_data').select('*');
      query = applyFilters(query, false);
      query = query.range(offset, offset + fetchLimit - 1);
      // Sort using text columns
      query = query.order('year', { ascending: false }).order('make').order('model');

      const res = await query;
      data = res.data;
      error = res.error;
    }

    if (error) {
       console.error('Supabase error:', error);
       return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
       return NextResponse.json({ data: [], page, pageSize: pageSizeParam });
    }

    // Grouping Logic
    const vehicleMap = new Map<string, VehicleSummary>();

    data.forEach((row: any) => {
      // Create a unique key for grouping
      const key = `${row.year}-${row.make}-${row.model}`; // Use raw values (text)

      if (!vehicleMap.has(key)) {
        vehicleMap.set(key, {
          id: row.id || key, // Use first trim ID or key
          year: String(row.year),
          make: row.make,
          model: row.model,
          heroImage: row.hero_image || row.image_url || row.images_url, // Fallbacks
          trims: [],
        });
      }

      const summary = vehicleMap.get(key)!;

      // Add trim
      summary.trims.push({
        ...row,
        id: row.id,
        // Ensure strictly typed fields for TrimVariant if needed, but standard row expansion works
        primaryImage: row.image_url,
      });
    });

    const summaries = Array.from(vehicleMap.values());

    return NextResponse.json({
      data: summaries,
      page,
      pageSize: pageSizeParam, // Note: We return fewer items than fetchLimit
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Failed to fetch vehicles: ${errorMessage}` },
      { status: 500 }
    );
  }
}
