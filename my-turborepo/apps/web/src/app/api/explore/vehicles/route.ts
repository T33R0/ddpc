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
        const value = filter.value;
        const op = filter.operator;

        // OPTIMIZATION: Only use computed numeric columns (_num) for range comparisons (gt, lt).
        // For equality (eq, neq) and text search (ilike), use the raw text column.
        const isRangeOp = ['gt', 'lt'].includes(op);

        if (isView && NUMERIC_COLUMNS.includes(column) && isRangeOp) {
          column = `${column}_num`;
        }

        switch (op) {
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

    // Sort by raw 'year' to avoid regex overhead during sort, unless strict numeric sort is needed.
    // Given most data is consistent, text sort is acceptable for performance.
    query = query.order('year', { ascending: false }).order('make').order('model');

    let { data, error } = await query;

    // Fallback to table if View doesn't exist
    if (error && error.code === '42P01') {
      console.warn('View v_vehicle_data_typed not found, falling back to vehicle_data table. Numeric filters may be inaccurate.');
      usingView = false;
      query = supabase.from('vehicle_data').select('*');
      query = applyFilters(query, false);
      query = query.range(offset, offset + fetchLimit - 1);
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

    // Check if we got the full limit of rows, indicating more might exist
    // Note: We fetched fetchLimit (pageSize * 5). If we got that many, there's likely more.
    // If we got fewer than fetchLimit, we've exhausted the source for this query.
    // This is still an approximation if the total count is exactly equal to fetchLimit, but "good enough" for infinite scroll.
    const hasMore = (data?.length ?? 0) === fetchLimit;

    // --- Image Resolution ---
    // Fetch primary images from the dedicated table to ensure high quality results
    const vehicleIds = data.map((v: any) => v.id);
    const imageMap = new Map<string, string>();

    if (vehicleIds.length > 0) {
      try {
        const { data: images } = await supabase
          .from('vehicle_primary_image')
          .select('vehicle_id, url')
          .in('vehicle_id', vehicleIds);

        if (images) {
          images.forEach((img: any) => {
            if (img.url) imageMap.set(img.vehicle_id, img.url);
          });
        }
      } catch (imgError) {
        console.warn('Failed to fetch primary images:', imgError);
        // Continue without primary images (fallbacks will apply)
      }
    }

    // Grouping Logic
    const vehicleMap = new Map<string, VehicleSummary>();

    data.forEach((row: any) => {
      // Create a unique key for grouping
      const key = `${row.year}-${row.make}-${row.model}`;

      // Robust image resolution:
      // 1. vehicle_primary_image (Best)
      // 2. vehicle_data.image_url
      // 3. vehicle_data.images_url (Sometimes holds the list)
      // 4. vehicle_data.vehicle_image
      // 5. vehicle_data.hero_image
      const primaryUrl = imageMap.get(row.id);
      const resolvedImage = primaryUrl || row.image_url || row.images_url || row.vehicle_image || row.hero_image || null;

      if (!vehicleMap.has(key)) {
        vehicleMap.set(key, {
          id: row.id || key,
          year: String(row.year),
          make: row.make,
          model: row.model,
          heroImage: resolvedImage, // Use first found image as hero for the group
          trims: [],
        });
      }

      const summary = vehicleMap.get(key)!;

      // If summary doesn't have a hero image yet, but this trim has one, update it?
      // Usually the first trim dictates the group image, but if it's missing, we could try others.
      // But keeping it simple: first trim wins (consistent with map insertion order usually).

      summary.trims.push({
        ...row,
        id: row.id,
        // Explicitly populate image fields expected by frontend
        primaryImage: resolvedImage,
        image_url: resolvedImage,
      });
    });

    const summaries = Array.from(vehicleMap.values());

    return NextResponse.json({
      data: summaries,
      hasMore,
      page,
      pageSize: pageSizeParam,
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Failed to fetch vehicles: ${errorMessage}` },
      { status: 500 }
    );
  }
}
