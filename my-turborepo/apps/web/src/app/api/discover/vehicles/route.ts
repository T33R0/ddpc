import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getBestVehicleImage } from '../../../../lib/vehicle-images';
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

  // Extract filter parameters
  const minYear = searchParams.get('minYear') ? parseInt(searchParams.get('minYear')!, 10) : null;
  const maxYear = searchParams.get('maxYear') ? parseInt(searchParams.get('maxYear')!, 10) : null;
  const make = searchParams.get('make') || null;
  const model = searchParams.get('model') || null;
  const engineType = searchParams.get('engineType') || null;
  const fuelType = searchParams.get('fuelType') || null;
  const drivetrain = searchParams.get('drivetrain') || null;
  const vehicleType = searchParams.get('vehicleType') || null;

  // Use the SQL function to get unique vehicles with all their trims (with filtering)
  const { data, error } = await supabase.rpc('get_unique_vehicles_with_trims', {
    limit_param: pageSize,
    offset_param: offset,
    min_year_param: minYear,
    max_year_param: maxYear,
    make_param: make,
    model_param: model,
    engine_type_param: engineType,
    fuel_type_param: fuelType,
    drivetrain_param: drivetrain,
    vehicle_type_param: vehicleType,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  // Transform the data into VehicleSummary format
  const summaries: VehicleSummary[] = (data as any[] | null)?.map((vehicle) => {
    const trims: TrimVariant[] = vehicle.trims.map((trimData: any) => ({
      ...trimData,
      primaryImage: getBestVehicleImage(trimData.image_url, vehicle.make, vehicle.model, vehicle.year),
    }));

    return {
      id: vehicle.id,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      heroImage: getBestVehicleImage(vehicle.hero_image, vehicle.make, vehicle.model, vehicle.year),
      trims,
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
