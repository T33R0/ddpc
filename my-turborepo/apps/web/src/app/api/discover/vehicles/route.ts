import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Vehicle, VehicleSummary, TrimVariant } from '@repo/types';

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
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from('v_vehicle_discovery')
    .select('*')
    .order('year', { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  const grouped = new Map<string, VehicleSummary>();

  (data as Vehicle[] | null)?.forEach((vehicle) => {
    const key = `${vehicle.year}-${vehicle.make}-${vehicle.model}`;
    const heroImage = vehicle.image_url?.split(';')[0];

    if (!grouped.has(key)) {
      grouped.set(key, {
        id: key,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        heroImage: heroImage ?? undefined,
        trims: [],
      });
    }

    const summary = grouped.get(key);

    if (!summary) {
      return;
    }

    if (!summary.heroImage && heroImage) {
      summary.heroImage = heroImage;
    }

    const trim: TrimVariant = {
      ...vehicle,
      primaryImage: heroImage ?? undefined,
    };

    summary.trims.push(trim);
  });

  const summaries = Array.from(grouped.values());

  return NextResponse.json({
    data: summaries,
    page,
    pageSize,
    total: summaries.length,
  });
}
