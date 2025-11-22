import { NextResponse } from 'next/server';
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

type FilterOptionsResponse = {
  years: number[];
  makes: string[];
  models: string[];
  engineTypes: string[];
  fuelTypes: string[];
  drivetrains: string[];
  bodyTypes: string[];
};

const emptyResponse: FilterOptionsResponse = {
  years: [],
  makes: [],
  models: [],
  engineTypes: [],
  fuelTypes: [],
  drivetrains: [],
  bodyTypes: [],
};

export async function GET() {
  try {
    const { data, error } = await supabase.rpc('get_vehicle_filter_options');

    if (error) {
      console.error('Failed to fetch filter options', error);
      return NextResponse.json({ error: 'Failed to fetch filter options' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(emptyResponse, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      });
    }

    const response: FilterOptionsResponse = {
      years: Array.isArray(data.years) ? data.years : [],
      makes: Array.isArray(data.makes) ? data.makes : [],
      models: Array.isArray(data.models) ? data.models : [],
      engineTypes: Array.isArray(data.engineTypes) ? data.engineTypes : [],
      fuelTypes: Array.isArray(data.fuelTypes) ? data.fuelTypes : [],
      drivetrains: Array.isArray(data.drivetrains) ? data.drivetrains : [],
      bodyTypes: Array.isArray(data.bodyTypes) ? data.bodyTypes : [],
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Unexpected error fetching filter options', error);
    return NextResponse.json({ error: 'Failed to fetch filter options' }, { status: 500 });
  }
}
