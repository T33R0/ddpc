import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { VehicleSummary, TrimVariant } from '@repo/types';

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10), 1);
  const pageSizeParam = parseInt(searchParams.get('pageSize') ?? '24', 10);
  const pageSize = Math.min(Math.max(pageSizeParam, 1), 100);
  const offset = (page - 1) * pageSize;

  // Use the SQL function to get unique vehicles
  const { data, error } = await supabase.rpc('get_unique_vehicles', {
    limit_param: pageSize,
    offset_param: offset,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  // Transform the data into VehicleSummary format
  const summaries: VehicleSummary[] = (data as any[] | null)?.map((vehicle) => {
    const heroImage = vehicle.image_url?.split(';')[0];

    return {
      id: `${vehicle.year}-${vehicle.make}-${vehicle.model}`,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      heroImage: heroImage ?? undefined,
      trims: [{
        ...vehicle,
        primaryImage: heroImage ?? undefined,
      } as TrimVariant],
    };
  }) ?? [];

  return NextResponse.json({
    data: summaries,
    page,
    pageSize,
    // Note: We don't know the total count without an additional query
    // For infinite scroll, we'll handle this on the frontend
  });
}
