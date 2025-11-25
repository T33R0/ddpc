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
  models: { make: string; model: string }[];
  engineTypes: string[];
  fuelTypes: string[];
  drivetrains: string[];
  bodyTypes: string[];
};

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
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

const CACHE_DURATION_MS = 1000 * 60 * 30; // 30 minutes
let cachedFilters: FilterOptionsResponse | null = null;
let cachedAt = 0;

const sanitizeStrings = (values: unknown[]) => {
  const normalized: string[] = [];
  const seen = new Set<string>();

  values.forEach((value) => {
    if (typeof value !== 'string') {
      return;
    }
    const cleaned = value.trim();
    if (!cleaned || seen.has(cleaned)) {
      return;
    }
    seen.add(cleaned);
    normalized.push(cleaned);
  });

  return normalized;
};

const sanitizeYears = (values: unknown[]) => {
  const normalized: number[] = [];
  const seen = new Set<number>();

  values.forEach((value) => {
    const parsed = typeof value === 'number' ? value : parseInt(String(value), 10);
    if (!Number.isFinite(parsed) || seen.has(parsed)) {
      return;
    }
    seen.add(parsed);
    normalized.push(parsed);
  });

  return normalized.sort((a, b) => b - a);
};

export async function GET() {
  const now = Date.now();

  if (cachedFilters && now - cachedAt < CACHE_DURATION_MS) {
    return NextResponse.json(cachedFilters, {
      headers: {
        ...CACHE_HEADERS,
        'X-Explore-Filters-Cache': 'HIT',
      },
    });
  }

  try {
    const { data, error } = await supabase.rpc('get_vehicle_filter_options');

    if (error) {
      console.error('Failed to fetch filter options', error);

      if (cachedFilters) {
        return NextResponse.json(cachedFilters, {
          headers: {
            ...CACHE_HEADERS,
            'X-Explore-Filters-Cache': 'STALE',
          },
        });
      }

      return NextResponse.json(emptyResponse, { status: 503 });
    }

    if (!data) {
      return NextResponse.json(emptyResponse, {
        headers: CACHE_HEADERS,
      });
    }

    const response: FilterOptionsResponse = {
      years: sanitizeYears(Array.isArray(data.years) ? data.years : []),
      makes: sanitizeStrings(Array.isArray(data.makes) ? data.makes : []),
      // Pass models through directly as they are now objects
      models: Array.isArray(data.models) ? data.models : [],
      engineTypes: sanitizeStrings(Array.isArray(data.engineTypes) ? data.engineTypes : []),
      fuelTypes: sanitizeStrings(Array.isArray(data.fuelTypes) ? data.fuelTypes : []),
      drivetrains: sanitizeStrings(Array.isArray(data.drivetrains) ? data.drivetrains : []),
      bodyTypes: sanitizeStrings(Array.isArray(data.bodyTypes) ? data.bodyTypes : []),
    };

    cachedFilters = response;
    cachedAt = now;

    return NextResponse.json(response, {
      headers: {
        ...CACHE_HEADERS,
        'X-Explore-Filters-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Unexpected error fetching filter options', error);

    if (cachedFilters) {
      return NextResponse.json(cachedFilters, {
        headers: {
          ...CACHE_HEADERS,
          'X-Explore-Filters-Cache': 'STALE',
        },
      });
    }

    return NextResponse.json(emptyResponse, { status: 503 });
  }
}
