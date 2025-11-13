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

// Helper function to add timeout to promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout: The query took too long to complete')), timeoutMs)
    ),
  ]);
}

export async function GET(request: NextRequest) {
  try {
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
    // Add timeout of 25 seconds (Supabase default is 20s, but we'll give a bit more buffer)
    const rpcPromise = supabase.rpc('get_unique_vehicles_with_trims', {
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

    const { data, error } = await withTimeout(rpcPromise, 25000);

    if (error) {
      // Check for timeout-related errors
      const errorMessage = error.message || 'Unknown error';
      const isTimeout = errorMessage.includes('timeout') || 
                       errorMessage.includes('canceling statement') ||
                       errorMessage.includes('statement timeout');
      
      return NextResponse.json(
        { 
          error: isTimeout 
            ? 'The query is taking too long. Try adding more specific filters (e.g., make, model) to narrow down the results.'
            : errorMessage 
        },
        { status: isTimeout ? 504 : 500 },
      );
    }

    // Transform the data into VehicleSummary format
    const summaries: VehicleSummary[] = (data as any[] | null)?.map((vehicle) => {
      const trims: TrimVariant[] = vehicle.trims.map((trimData: any) => ({
        ...trimData,
        primaryImage: trimData.image_url || undefined,
      }));

      return {
        id: vehicle.id,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        heroImage: vehicle.hero_image || undefined,
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
  } catch (err) {
    // Handle timeout or other errors
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('Request timeout');
    
    return NextResponse.json(
      { 
        error: isTimeout 
          ? 'The query is taking too long. Try adding more specific filters (e.g., make, model) to narrow down the results.'
          : `Failed to fetch vehicles: ${errorMessage}`
      },
      { status: isTimeout ? 504 : 500 },
    );
  }
}
