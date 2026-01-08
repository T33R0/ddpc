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

// Bolt Optimization: Select only necessary columns to reduce payload size
// Excluding: source_json, reviews, features lists, expert ratings, etc.
const EXPLORE_SELECT_FIELDS = [
  'id',
  'year',
  'make',
  'model',
  'trim',
  'trim_description',
  'body_type',
  'drive_type',
  'engine_size_l',
  'cylinders',
  'engine_type',
  'fuel_type',
  'horsepower_hp',
  'horsepower_rpm',
  'torque_ft_lbs',
  'torque_rpm',
  'transmission',
  'curb_weight_lbs',
  'suspension',
  'epa_combined_mpg',
  'epa_city_highway_mpg',
  'fuel_tank_capacity_gal',
  'ground_clearance_in',
  'max_towing_capacity_lbs',
  'total_seating',
  'cargo_capacity_cuft',
  'max_cargo_capacity_cuft',
  'images_url',
  'base_msrp',
  'new_price_range',
  'used_price_range',
  'doors',
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
    let query = supabase.from('v_vehicle_data_typed').select(EXPLORE_SELECT_FIELDS.join(','));

    // Apply Filters function - Simplified and optimized
    const applyFilters = (q: any, isView: boolean) => {
      // Filter out empty values and ensure we have valid filters
      const validFilters = filters.filter((f) => f.value && String(f.value).trim() !== '');
      
      if (validFilters.length === 0) {
        return q;
      }

      // Group filters by column to handle same-column filters efficiently
      const filtersByColumn = new Map<string, typeof validFilters>();
      
      validFilters.forEach((filter) => {
        if (!filtersByColumn.has(filter.column)) {
          filtersByColumn.set(filter.column, []);
        }
        filtersByColumn.get(filter.column)!.push(filter);
      });

      // Apply filters: same column with multiple "eq" = use .in() for OR logic
      // Different columns = AND logic (Supabase default)
      filtersByColumn.forEach((columnFilters, column) => {
        const isNumericColumn = NUMERIC_COLUMNS.includes(column);
        const isRangeOp = (op: string) => ['gt', 'lt', 'gte', 'lte'].includes(op);
        
        if (columnFilters.length === 1) {
          // Single filter on this column - apply directly
          const filter = columnFilters[0];
          q = applySingleFilter(q, filter, column, isView, isNumericColumn, isRangeOp);
        } else {
          // Multiple filters on same column
          const allEq = columnFilters.every(f => f.operator === 'eq');
          const allIlike = columnFilters.every(f => f.operator === 'ilike');
          
          if (allEq) {
            // Multiple "Equals" filters on same column - use .in() for OR logic (efficient)
            const values = columnFilters.map(f => {
              const value = String(f.value).trim();
              if (isNumericColumn) {
                const numVal = parseFloat(value);
                return !isNaN(numVal) && isFinite(numVal) ? numVal : value;
              }
              return value;
            }).filter(v => v !== '' && v !== null && v !== undefined);
            
            if (values.length > 0) {
              q = q.in(column, values);
            }
          } else if (allIlike) {
            // Multiple "Contains" filters on same column - use OR
            const orConditions = columnFilters.map(f => {
              const value = String(f.value).trim();
              return `${column}.ilike.%${value}%`;
            }).join(',');
            q = q.or(orConditions);
          } else {
            // Mixed operators - apply each filter (they'll be AND'd, which may not be what user wants)
            // But this is better than breaking. User should use same operator for same column.
            columnFilters.forEach(filter => {
              q = applySingleFilter(q, filter, column, isView, isNumericColumn, isRangeOp);
            });
          }
        }
      });

      return q;
    };

    // Helper function to apply a single filter
    const applySingleFilter = (
      q: any, 
      filter: typeof filters[0], 
      column: string, 
      isView: boolean,
      isNumericColumn: boolean,
      isRangeOp: (op: string) => boolean
    ) => {
      let targetColumn = column;
      let value: string | number = String(filter.value).trim();
      const op = filter.operator;

      // For the view, use _num columns for range operations on numeric fields
      if (isView && isNumericColumn && isRangeOp(op)) {
        targetColumn = `${column}_num`;
      }

      // Convert value to number for numeric operations if possible
      let processedValue: string | number = value;
      if (isNumericColumn && (op === 'eq' || op === 'neq' || isRangeOp(op))) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && isFinite(numValue)) {
          processedValue = numValue;
        }
      }

      // Apply the filter operation
      switch (op) {
        case 'eq':
          q = q.eq(targetColumn, processedValue);
          break;
        case 'neq':
          q = q.neq(targetColumn, processedValue);
          break;
        case 'gt':
          if (isNumericColumn && typeof processedValue === 'number') {
            q = q.gt(targetColumn, processedValue);
          } else {
            const numVal = parseFloat(value);
            if (!isNaN(numVal) && isFinite(numVal)) {
              q = q.gt(targetColumn, numVal);
            }
          }
          break;
        case 'lt':
          if (isNumericColumn && typeof processedValue === 'number') {
            q = q.lt(targetColumn, processedValue);
          } else {
            const numVal = parseFloat(value);
            if (!isNaN(numVal) && isFinite(numVal)) {
              q = q.lt(targetColumn, numVal);
            }
          }
          break;
        case 'gte':
          if (isNumericColumn && typeof processedValue === 'number') {
            q = q.gte(targetColumn, processedValue);
          } else {
            const numVal = parseFloat(value);
            if (!isNaN(numVal) && isFinite(numVal)) {
              q = q.gte(targetColumn, numVal);
            }
          }
          break;
        case 'lte':
          if (isNumericColumn && typeof processedValue === 'number') {
            q = q.lte(targetColumn, processedValue);
          } else {
            const numVal = parseFloat(value);
            if (!isNaN(numVal) && isFinite(numVal)) {
              q = q.lte(targetColumn, numVal);
            }
          }
          break;
        case 'ilike':
          q = q.ilike(targetColumn, `%${value}%`);
          break;
        default:
          q = q.eq(targetColumn, processedValue);
      }
      return q;
    };

    query = applyFilters(query, true);
    query = query.range(offset, offset + fetchLimit - 1);

    // Sort by raw 'year' to avoid regex overhead during sort, unless strict numeric sort is needed.
    // Given most data is consistent, text sort is acceptable for performance.
    query = query.order('year', { ascending: false }).order('make').order('model');

    let { data, error } = await query;
    
    // Log filter application for debugging (only in development)
    if (process.env.NODE_ENV === 'development' && filters.length > 0) {
      console.log('[Explore API] Applied filters:', JSON.stringify(filters, null, 2));
      console.log('[Explore API] Results count:', data?.length || 0);
    }

    // Fallback to table if View doesn't exist
    if (error && error.code === '42P01') {
      console.warn('View v_vehicle_data_typed not found, falling back to vehicle_data table. Numeric filters may be inaccurate.');
      usingView = false;
      query = supabase.from('vehicle_data').select(EXPLORE_SELECT_FIELDS.join(','));
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

      let imageUrl = row.images_url;
      // Handle images_url being a semicolon-separated string
      if (typeof imageUrl === 'string' && imageUrl.includes(';')) {
        imageUrl = imageUrl.split(';')[0];
      }

      const resolvedImage = primaryUrl || imageUrl || null;

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
