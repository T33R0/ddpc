import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

// Helper to fetch all rows with pagination
async function fetchAll(
  queryBuilder: any,
  batchSize: number = 1000
): Promise<any[]> {
  let allData: any[] = [];
  let from = 0;
  let to = batchSize - 1;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await queryBuilder.range(from, to);

    if (error) throw error;

    if (data && data.length > 0) {
      allData = [...allData, ...data];
      // If we got fewer rows than requested, we've reached the end
      if (data.length < batchSize) {
        hasMore = false;
      } else {
        from += batchSize;
        to += batchSize;
      }
    } else {
      hasMore = false;
    }
  }

  return allData;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'makes' or 'models'
  const year = searchParams.get('year');
  const make = searchParams.get('make');

  try {
    if (type === 'makes' && year) {
      // Get makes for a specific year
      // We need to fetch all potentially matching rows because unique filtering happens in application memory
      // after fetching (since we can't easily do distinct across paginated calls without a specific RPC/view)
      const query = supabase
        .from('vehicle_data')
        .select('make')
        .eq('year', parseInt(year))
        .not('make', 'is', null);

      const data = await fetchAll(query);

      // Get unique makes and sort them
      const uniqueMakes = [...new Set(data.map((item: any) => item.make))].sort();
      return NextResponse.json(uniqueMakes);

    } else if (type === 'models' && year && make) {
      // Get models for a specific year and make
      const query = supabase
        .from('vehicle_data')
        .select('model')
        .eq('year', parseInt(year))
        .eq('make', make)
        .not('model', 'is', null);

      const data = await fetchAll(query);

      // Get unique models and sort them
      const uniqueModels = [...new Set(data.map((item: any) => item.model))].sort();
      return NextResponse.json(uniqueModels);

    } else {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error fetching vehicle options:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
